import { supabase } from "./supabaseClient";

// Shared upload helper for the three Supabase Storage buckets created in
// supabase/migrations/20260816170000_storage_buckets.sql:
//
//   certificate-templates -> certificate_templates.background_image_url
//   qr-photos             -> events.qr_photo_url
//   avatars                -> profiles.avatar_url
//
// Replaces the base64/localStorage approach these three upload flows used
// before (FileReader.readAsDataURL / canvas.toDataURL stored directly in
// component state and localStorage). Each flow now uploads the real file
// to its bucket and keeps only the resulting public URL in state — no
// base64 payload is ever held in memory or persisted client-side.

export type BucketName = "certificate-templates" | "qr-photos" | "avatars";

export type UploadResult =
  | { status: "success"; publicUrl: string }
  | { status: "error"; message: string };

/**
 * Uploads a file to the given bucket at `path` and returns its public URL.
 * All three buckets are public (see the migration), so a successful
 * upload's URL is immediately usable in an <img src> or stored directly
 * in a database column — no signed URL step needed.
 *
 * `upsert: true` lets "Replace image/photo" flows re-upload to the same
 * path without a 409 conflict.
 */
export async function uploadToBucket(
  bucket: BucketName,
  path: string,
  file: File,
): Promise<UploadResult> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { status: "success", publicUrl: data.publicUrl };
}

/**
 * Builds a storage object path that keeps the original file's extension
 * (Storage doesn't infer one from contentType) and avoids collisions
 * between repeated uploads for the same logical entity (template id,
 * event id, user id) via a timestamp suffix.
 */
export function buildObjectPath(prefix: string, file: File): string {
  const ext = extensionFor(file);
  return `${prefix}-${Date.now()}${ext}`;
}

function extensionFor(file: File): string {
  const nameMatch = /\.[a-zA-Z0-9]+$/.exec(file.name);
  if (nameMatch) return nameMatch[0].toLowerCase();

  switch (file.type) {
    case "image/png": return ".png";
    case "image/jpeg": return ".jpg";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    case "application/pdf": return ".pdf";
    default: return "";
  }
}
