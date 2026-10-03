import { supabase } from "./supabase";

const BUCKET_NAME = "produce-images";

/**
 * Upload one produce image to Supabase Storage
 * and return its public URL.
 */
export async function uploadProduceImage(file, farmerId) {
  if (!file) {
    throw new Error("No image file provided.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not a valid image.`);
  }

  // Keep individual images reasonably small for the MVP.
  const MAX_SIZE = 6 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    throw new Error(`${file.name} is larger than 6 MB.`);
  }

  const fileExtension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  const folder = farmerId || "anonymous";
  const filePath = `${folder}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Supabase image upload error:", error);
    throw new Error(error.message || "Failed to upload image.");
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Image uploaded, but public URL could not be generated.");
  }

  return publicUrlData.publicUrl;
}

/**
 * Upload multiple produce images.
 */
export async function uploadProduceImages(files, farmerId) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedUrls = [];

  for (const file of files) {
    const publicUrl = await uploadProduceImage(file, farmerId);
    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}