
/**
 * Cloudinary Service for Maruti PG
 * Using API Key: 561777539547356
 */

const CLOUDINARY_API_KEY = "561777539547356";
// Note: Client-side unsigned uploads usually require a cloud name and an upload preset.
// You can configure these in your Cloudinary Dashboard.
const CLOUD_NAME = "maruti-pg-hub"; 
const UPLOAD_PRESET = "maruti_unsigned"; 

export const uploadToCloudinary = async (fileBase64: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', fileBase64);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error(data.error?.message || "Upload failed");
  } catch (error) {
    console.error("Cloudinary Error:", error);
    // Fallback to local base64 if upload fails to keep app functional
    return fileBase64;
  }
};
