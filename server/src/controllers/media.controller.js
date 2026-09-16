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

function validateMagicBytes(buffer, mimetype) {
  if (!buffer || buffer.length < 4) return false;
  if (mimetype === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimetype === "image/webp") {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (mimetype === "application/pdf") {
    return buffer.toString("ascii", 0, 4) === "%PDF";
  }
  return false;
}

function uploadDocumentStream(buffer, mimetype) {
  const isPdf = mimetype === "application/pdf";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "fixit-local/verifications",
        resource_type: isPdf ? "raw" : "image",
        type: "private",
      },
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

export const uploadVerificationDocument = asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError("Storage service is not configured", 503);
  }

  const file = req.file;
  if (!file) throw new AppError("A verification document file is required", 400);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError("Only JPEG, PNG, WEBP, and PDF documents are allowed", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new AppError("Verification document size cannot exceed 5 MB", 400);
  }

  if (!validateMagicBytes(file.buffer, file.mimetype)) {
    throw new AppError("File content does not match the allowed document signature", 400);
  }

  const profile = await ProviderProfile.findOne({ user: req.user.id });
  if (!profile) {
    throw new AppError("Provider profile not found", 404);
  }

  const MAX_DOCUMENTS = 5;
  if (profile.verificationDocuments && profile.verificationDocuments.length >= MAX_DOCUMENTS) {
    throw new AppError(`Maximum limit of ${MAX_DOCUMENTS} verification documents reached. Please remove an existing document before uploading a new one.`, 400);
  }

  let uploadResult;
  try {
    uploadResult = await uploadDocumentStream(file.buffer, file.mimetype);
  } catch {
    throw new AppError("Verification document upload failed", 502);
  }

  const updatedProfile = await ProviderProfile.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: { verificationDocuments: uploadResult.secure_url },
      approvalStatus: "pending",
      isApproved: false,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  sendSuccess(res, {
    data: {
      documentUrl: uploadResult.secure_url,
      verificationDocuments: updatedProfile.verificationDocuments,
      approvalStatus: updatedProfile.approvalStatus,
    },
    message: "Verification document uploaded successfully and submitted for review.",
  });
});

