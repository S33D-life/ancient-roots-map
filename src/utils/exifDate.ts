/**
 * Extract the DateTimeOriginal from a JPEG/TIFF file's EXIF data.
 * Returns an ISO date string or null if not found.
 * Works with both File objects and base64 data URLs.
 */

export async function extractExifDate(input: File | string): Promise<string | null> {
  try {
    const buffer = input instanceof File
      ? await input.arrayBuffer()
      : base64ToArrayBuffer(input);

    const view = new DataView(buffer);

    // Check JPEG SOI marker
    if (view.getUint16(0) !== 0xFFD8) return null;

    let offset = 2;
    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      offset += 2;

      // APP1 marker (EXIF)
      if (marker === 0xFFE1) {
        const length = view.getUint16(offset);
        const exifStart = offset + 2;

        // Check "Exif\0\0"
        if (
          view.getUint8(exifStart) === 0x45 &&
          view.getUint8(exifStart + 1) === 0x78 &&
          view.getUint8(exifStart + 2) === 0x69 &&
          view.getUint8(exifStart + 3) === 0x66
        ) {
          return parseExifBlock(view, exifStart + 6);
        }

        offset += length;
      } else if ((marker & 0xFF00) === 0xFF00) {
        // Skip other markers
        const len = view.getUint16(offset);
        offset += len;
      } else {
        break;
      }
    }
  } catch {
    // Silent fail
  }
  return null;
}

function base64ToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function parseExifBlock(view: DataView, tiffStart: number): string | null {
  const byteOrder = view.getUint16(tiffStart);
  const littleEndian = byteOrder === 0x4949; // II = Intel

  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const dateStr = searchIFDForDate(view, tiffStart, tiffStart + ifdOffset, littleEndian);
  return dateStr;
}

// Tag 0x9003 = DateTimeOriginal, 0x9004 = DateTimeDigitized, 0x0132 = DateTime
const DATE_TAGS = [0x9003, 0x9004, 0x0132];

function searchIFDForDate(view: DataView, tiffStart: number, ifdStart: number, le: boolean): string | null {
  try {
    const entries = view.getUint16(ifdStart, le);

    for (let i = 0; i < entries; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);

      if (DATE_TAGS.includes(tag)) {
        const count = view.getUint32(entryOffset + 4, le);
        const valueOffset = count > 4
          ? tiffStart + view.getUint32(entryOffset + 8, le)
          : entryOffset + 8;

        const dateStr = readAscii(view, valueOffset, Math.min(count, 20));
        const parsed = parseExifDateString(dateStr);
        if (parsed) return parsed;
      }

      // Check for ExifIFD pointer (tag 0x8769)
      if (tag === 0x8769) {
        const subIfdOffset = tiffStart + view.getUint32(entryOffset + 8, le);
        const result = searchIFDForDate(view, tiffStart, subIfdOffset, le);
        if (result) return result;
      }
    }
  } catch {
    // Bounds error, stop
  }
  return null;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    str += String.fromCharCode(c);
  }
  return str;
}

/** Parses "YYYY:MM:DD HH:MM:SS" → ISO string */
function parseExifDateString(s: string): string | null {
  const match = s.trim().match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min, sec] = match;
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
}
