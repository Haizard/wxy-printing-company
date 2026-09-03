/**
 * Robust client-side image processing for upload fields.
 *
 * Why this exists:
 * - The original inline handlers used FileReader → Image() → canvas with no
 *   error handling, so any file the browser could not decode (HEIC/HEIF from
 *   iPhones, oversized images, unusual formats, …) silently stalled and the
 *   upload button stayed on "Processing…" forever.
 * - The first fix made every function promise-based and never-throwing, but it
 *   still returned `null` for problem files, which callers could drop without
 *   any visible feedback — an upload where "nothing happens".
 *
 * Current contract:
 * - `processImageFileForUpload` ALWAYS resolves and returns an outcome for the
 *   file: `{ dataUrl }` when usable, or `{ dataUrl: null, reason }` otherwise.
 *   Undecodable-but-reasonable files are passed through in their original form
 *   so the upload still visibly succeeds instead of being dropped.
 * - `compressImageFiles` / `compressImageFile` keep the old signatures for
 *   compatibility (they resolve to only the successful data URLs).
 */

const DEFAULT_MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.72;
/** Files this big that can't be decoded are rejected instead of stored raw. */
const RAW_FALLBACK_MAX_BYTES = 15 * 1024 * 1024;

export interface ImageUploadOutcome {
  /** Compressed JPEG data URL (or original data URL when used as fallback). */
  dataUrl: string | null;
  /** True when the file could not be used at all. */
  skipped: boolean;
  /** Why it was skipped / fell back (for user-facing messages). */
  reason?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.onabort = () => reject(new Error("Read aborted"));
    reader.readAsDataURL(file);
  });
}

function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const timeout = window.setTimeout(() => {
      img.src = "";
      reject(new Error("Image decode timed out"));
    }, 15000);
    img.onload = () => {
      window.clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Image could not be decoded"));
    };
    img.src = dataUrl;
  });
}

function resizeToJpeg(img: HTMLImageElement, maxDimension: number): string {
  const canvas = document.createElement("canvas");
  let { width, height } = img;
  if (width <= 0 || height <= 0) {
    throw new Error("Image has no dimensions");
  }
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.max(1, Math.round((height * maxDimension) / width));
      width = maxDimension;
    } else {
      width = Math.max(1, Math.round((width * maxDimension) / height));
      height = maxDimension;
    }
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function humanReason(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("decode") || msg.includes("format")) {
    return "format not supported by this browser (e.g. HEIC) — convert to JPG or PNG";
  }
  if (msg.includes("read")) {
    return "file could not be read";
  }
  if (msg.includes("size") || msg.includes("large")) {
    return "file too large";
  }
  if (msg.includes("canvas")) {
    return "image could not be processed on this device";
  }
  return err instanceof Error ? err.message : "unknown error";
}

/**
 * Processes ONE image file into a data URL and ALWAYS resolves.
 *
 * 1. Small, already-web-friendly files (≤ 1.5 MB) are kept as-is so PNG/WebP
 *    transparency and quality are preserved and no decode step is needed.
 * 2. Larger files are decoded and re-encoded to a ~1200px JPEG.
 * 3. If decoding/re-encoding fails but the file is ≤ RAW_FALLBACK_MAX_BYTES,
 *    the ORIGINAL data URL is returned so the upload still completes.
 * 4. Only genuinely unusable files (unreadable or > 15 MB and undecodable)
 *    resolve with `skipped: true` + a human reason.
 */
export async function processImageFileForUpload(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<ImageUploadOutcome> {
  try {
    const dataUrl = await readFileAsDataUrl(file);

    // Tiny files don't need compression — keep them untouched. This also
    // guarantees PNG alpha survives and makes picking several small images
    // instant.
    const webFriendly = /^image\/(png|webp|gif|jpeg)$/.test(file.type || "");
    if (webFriendly && file.size <= 1.5 * 1024 * 1024) {
      return { dataUrl, skipped: false };
    }

    try {
      const img = await decodeImage(dataUrl);
      return { dataUrl: resizeToJpeg(img, maxDimension), skipped: false };
    } catch (err) {
      // Undecodable (HEIC, TIFF, weird container, decode timeout…).
      if (file.size <= RAW_FALLBACK_MAX_BYTES) {
        // Pass it through unchanged — better to show/store something than to
        // drop the file silently. Browsers that can display it (e.g. Safari
        // with HEIC) will render it fine.
        return {
          dataUrl,
          skipped: false,
          reason: "kept original (could not be compressed on this device)",
        };
      }
      return {
        dataUrl: null,
        skipped: true,
        reason: humanReason(err) + " — try a file smaller than 15 MB",
      };
    }
  } catch (err) {
    return { dataUrl: null, skipped: true, reason: humanReason(err) };
  }
}

/** Convenience: processes a File[] / FileList sequentially. Never throws. */
export async function processImageFilesForUpload(
  files: FileList | File[],
  maxDimension?: number,
): Promise<ImageUploadOutcome[]> {
  const list = Array.from(files);
  const outcomes: ImageUploadOutcome[] = [];
  for (const file of list) {
    // Sequential (not Promise.all) keeps memory usage flat when several large
    // photos are selected at once on a phone.
    outcomes.push(await processImageFileForUpload(file, maxDimension));
  }
  return outcomes;
}

/**
 * Compatibility wrapper — resolves with just the data URLs that succeeded.
 * Prefer `processImageFileForUpload` / `processImageFilesForUpload` in new code
 * so skipped files are surfaced to the user.
 */
export async function compressImageFile(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<string | null> {
  const outcome = await processImageFileForUpload(file, maxDimension);
  return outcome.dataUrl;
}

/**
 * Compatibility wrapper — resolves with only the data URLs that succeeded.
 */
export async function compressImageFiles(
  files: FileList | File[],
  maxDimension?: number,
): Promise<string[]> {
  const outcomes = await processImageFilesForUpload(files, maxDimension);
  return outcomes
    .filter((o): o is ImageUploadOutcome & { dataUrl: string } => o.dataUrl !== null)
    .map((o) => o.dataUrl);
}

/**
 * Reads an arbitrary file (PDF, AI, EPS, images, …) as a data URL without any
 * re-encoding. Resolves to `null` if the file cannot be read.
 */
export async function readFileAsBase64(file: File): Promise<string | null> {
  try {
    return await readFileAsDataUrl(file);
  } catch {
    return null;
  }
}
