/**
 * Background photo processor — handles image compression, thumbnail generation,
 * and upload after a tree record has already been created.
 *
 * Flow:
 * 1. Upload original to storage immediately (fast, preserves data)
 * 2. Generate compressed + thumbnail client-side
 * 3. Upload processed versions
 * 4. Update tree record with URLs and photo_status = 'ready'
 */
import { supabase } from "@/integrations/supabase/client";

export type PhotoProcessingStatus = "none" | "pending" | "processing" | "ready" | "failed";

interface ProcessPhotoOptions {
  treeId: string;
  userId: string;
  file: File;
  /** Called whenever photo_status changes */
  onStatusChange?: (status: PhotoProcessingStatus, urls?: { original?: string; processed?: string; thumb?: string }) => void;
}

/** Compress an image to target max dimension and quality */
function resizeImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

/** Generate a small thumbnail */
function generateThumbnail(file: File, size = 400): Promise<Blob> {
  return resizeImage(file, size, 0.7);
}

function storagePath(userId: string, treeId: string, suffix: string) {
  return `${userId}/${treeId}/${suffix}`;
}

/**
 * Process a photo in the background. The tree record should already exist
 * with photo_status = 'pending'.
 */
export async function processTreePhoto({ treeId, userId, file, onStatusChange }: ProcessPhotoOptions) {
  const notify = onStatusChange ?? (() => {});
  const ts = Date.now();

  try {
    // ── Step 1: Upload original ──
    notify("pending");
    const origPath = storagePath(userId, treeId, `original-${ts}.jpeg`);
    const { error: origErr } = await supabase.storage
      .from("offerings")
      .upload(origPath, file, { contentType: file.type || "image/jpeg" });

    if (origErr) throw origErr;

    const { data: origUrlData } = supabase.storage.from("offerings").getPublicUrl(origPath);
    const originalUrl = origUrlData.publicUrl;

    // Update tree with original URL immediately
    await supabase
      .from("trees")
      .update({
        photo_status: "processing" as any,
        photo_original_url: originalUrl,
      } as any)
      .eq("id", treeId);

    notify("processing", { original: originalUrl });

    // ── Step 2: Generate compressed + thumbnail ──
    const [compressed, thumb] = await Promise.all([
      resizeImage(file, 2048, 0.82),
      generateThumbnail(file, 400),
    ]);

    // ── Step 3: Upload processed versions ──
    const processedPath = storagePath(userId, treeId, `processed-${ts}.jpeg`);
    const thumbPath = storagePath(userId, treeId, `thumb-${ts}.jpeg`);

    const [procUpload, thumbUpload] = await Promise.all([
      supabase.storage.from("offerings").upload(processedPath, compressed, { contentType: "image/jpeg" }),
      supabase.storage.from("offerings").upload(thumbPath, thumb, { contentType: "image/jpeg" }),
    ]);

    if (procUpload.error) throw procUpload.error;
    if (thumbUpload.error) throw thumbUpload.error;

    const { data: procUrlData } = supabase.storage.from("offerings").getPublicUrl(processedPath);
    const { data: thumbUrlData } = supabase.storage.from("offerings").getPublicUrl(thumbPath);

    // ── Step 4: Update tree record ──
    await supabase
      .from("trees")
      .update({
        photo_status: "ready" as any,
        photo_processed_url: procUrlData.publicUrl,
        photo_thumb_url: thumbUrlData.publicUrl,
        photo_error: null,
      } as any)
      .eq("id", treeId);

    notify("ready", {
      original: originalUrl,
      processed: procUrlData.publicUrl,
      thumb: thumbUrlData.publicUrl,
    });

    // Also create the photo offering (non-blocking)
    await supabase.from("offerings").insert({
      tree_id: treeId,
      title: "First encounter",
      type: "photo" as any,
      media_url: procUrlData.publicUrl,
      created_by: userId,
      visibility: "public",
    });

    return { success: true, originalUrl, processedUrl: procUrlData.publicUrl, thumbUrl: thumbUrlData.publicUrl };
  } catch (err: any) {
    console.error("Background photo processing failed:", err);

    // Mark as failed but keep whatever we have
    await supabase
      .from("trees")
      .update({
        photo_status: "failed" as any,
        photo_error: err.message || "Processing failed",
      } as any)
      .eq("id", treeId);

    notify("failed");
    return { success: false, error: err.message };
  }
}
