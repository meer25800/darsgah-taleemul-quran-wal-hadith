import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return true;
}

export async function uploadToCloudinary(file, folder = "darsgah") {
  if (!configureCloudinary()) {
    const baseUrl = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      publicId: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname
    };
  }
  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto"
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname
  };
}
