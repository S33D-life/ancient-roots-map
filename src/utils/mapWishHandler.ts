/**
 * mapWishHandler — Handles popup wish-star, share, and plant-seed button clicks
 * via event delegation on the map container.
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Set up event delegation for popup buttons (wish + share + plant seed) */
export function setupPopupActions(container: HTMLElement): () => void {
  const handler = async (e: Event) => {
    const target = e.target as HTMLElement;

    // Wish button
    const wishBtn = target.closest<HTMLElement>("[data-wish-tree]");
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = wishBtn.dataset.wishTree;
      if (!treeId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.info("Sign in to save wishes", {
          description: "Create an account to build your wish list of Ancient Friends.",
        });
        return;
      }

      // Check if already wished
      const { data: existing } = await supabase
        .from("tree_wishlist")
        .select("id")
        .eq("tree_id", treeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove wish
        await supabase.from("tree_wishlist").delete().eq("id", existing.id);
        wishBtn.style.color = "hsl(42, 50%, 55%)";
        wishBtn.style.borderColor = "hsla(42, 70%, 55%, 0.25)";
        wishBtn.textContent = "⭐";
        toast("Wish removed", { description: "This tree has been removed from your wishes." });
      } else {
        // Add wish
        const { error } = await supabase.from("tree_wishlist").insert({
          tree_id: treeId,
          user_id: user.id,
        });
        if (error) {
          toast.error("Couldn't save wish");
          return;
        }
        wishBtn.style.color = "hsl(42, 90%, 60%)";
        wishBtn.style.borderColor = "hsla(42, 90%, 55%, 0.6)";
        wishBtn.style.background = "hsla(42, 50%, 20%, 0.9)";
        wishBtn.textContent = "⭐";
        toast.success("Wish saved!", { description: "This Ancient Friend has been added to your wishes." });
      }
      return;
    }

    // Share button
    const shareBtn = target.closest<HTMLElement>("[data-share-tree]");
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      const treeId = shareBtn.dataset.shareTree;
      if (!treeId) return;

      const url = `${window.location.origin}/tree/${treeId}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "Meet this Ancient Friend", url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied!", { description: "Share this tree with a friend." });
        }
      } catch {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied!");
        } catch {
          toast.error("Couldn't copy link");
        }
      }
    }
  };

  container.addEventListener("click", handler);
  return () => container.removeEventListener("click", handler);
}
