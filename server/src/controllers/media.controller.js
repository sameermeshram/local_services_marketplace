import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { cloudinary } from "../config/cloudinary.js";

function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "fixit-local/providers", resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export const uploadProviderPhoto = asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError("Image storage is not configured", 503);
  }
  if (!req.file) throw new AppError("An image file is required", 400);
  if (!req.file.mimetype.startsWith("image/")) throw new AppError("Only image files are allowed", 400);

  let result;
  try {
    result = await uploadImage(req.file.buffer);
  } catch {
    throw new AppError("Image upload failed", 502);
  }

  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user.id },
    { profileImage: result.secure_url },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  sendSuccess(res, {
    data: { profileImage: profile.profileImage },
    message: "Profile photo uploaded",
  });
});
