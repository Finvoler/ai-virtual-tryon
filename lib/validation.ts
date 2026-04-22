// Shared image-upload validation used by both the client and the API route.

export interface ValidationOptions {
  maxBytes: number;
  allowedTypes: Set<string>;
}

export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImageFile(
  file: File,
  opts: ValidationOptions = { maxBytes: DEFAULT_MAX_BYTES, allowedTypes: DEFAULT_ALLOWED },
): string | null {
  if (!opts.allowedTypes.has(file.type)) {
    return `Unsupported file type '${file.type}'. Allowed: ${[...opts.allowedTypes].join(", ")}.`;
  }
  if (file.size > opts.maxBytes) {
    return `File is too large (${(file.size / 1_048_576).toFixed(1)} MB). Limit is ${(
      opts.maxBytes / 1_048_576
    ).toFixed(0)} MB.`;
  }
  return null;
}
