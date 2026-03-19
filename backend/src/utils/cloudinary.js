import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// UPLOAD
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFilePath); // delete temp file
    return response;
  } catch (error) {
    if (localFilePath) fs.unlinkSync(localFilePath);
    return null;
  }
};

// DELETE
export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    const publicId = fileUrl.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log("Cloudinary delete failed:", error.message);
  }
};