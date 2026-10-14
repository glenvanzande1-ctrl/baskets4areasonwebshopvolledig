import { createClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

export function getStorageAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function ensureProductImageBucket() {
  const supabase = getStorageAdmin();
  const { data } = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: 3 * 1024 * 1024,
      allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  return supabase;
}
