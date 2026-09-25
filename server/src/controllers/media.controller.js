import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { cloudinary } from "../config/cloudinary.js";
import {
  destroyPrivateDocument,
  getPrivateDocumentUrl,
  parseDocumentIndex,
  verificationDocumentMetadata,
} from "../utils/verificationDocument.js";
import https from "https";
import http from "http";

function streamDocumentFromUrl(document, res) {
  const documentUrl = getPrivateDocumentUrl(document);
  const client = documentUrl.startsWith("https") ? https : http;

  return new Promise((resolve) => {
    client
      .get(documentUrl, (cloudinaryRes) => {
        if (cloudinaryRes.statusCode >= 400) {
          res.status(cloudinaryRes.statusCode >= 500 ? 502 : 404).json({
            success: false,
            message: "Unable to retrieve verification document from storage",
            data: null,
            errors: [],
          });
          return resolve();
        }

        const contentType =
          cloudinaryRes.headers["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "private, no-store");

        if (cloudinaryRes.headers["content-length"]) {
          res.setHeader("Content-Length", cloudinaryRes.headers["content-length"]);
        }

        cloudinaryRes.pipe(res);
        cloudinaryRes.on("end", resolve);
      })
      .on("error", (err) => {
        console.error("Error streaming document:", err.message);
        res.status(502).json({
          success: false,
          message: "Failed to connect to media storage",
          data: null,
          errors: [],
        });
        resolve();
      });
  });
}

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
    { new: true },
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

  const documentRecord = {
    publicId: uploadResult.public_id,
    resourceType: uploadResult.resource_type,
    format: uploadResult.format,
    originalFilename: file.originalname,
    uploadedAt: new Date(),
  };

  const updatedProfile = await ProviderProfile.findOneAndUpdate(
    {
      user: req.user.id,
      $expr: {
        $lt: [{ $size: { $ifNull: ["$verificationDocuments", []] } }, MAX_DOCUMENTS],
      },
    },
    {
      $push: { verificationDocuments: documentRecord },
      approvalStatus: "pending",
      isApproved: false,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!updatedProfile) {
    try {
      await destroyPrivateDocument(documentRecord);
    } catch {
      // The unreferenced upload is handled by storage reconciliation.
    }
    throw new AppError("Maximum limit of 5 verification documents reached", 400);
  }

  sendSuccess(res, {
    data: {
      document: verificationDocumentMetadata(
        updatedProfile.verificationDocuments.at(-1),
        updatedProfile.verificationDocuments.length - 1,
      ),
      verificationDocuments: updatedProfile.verificationDocuments.map(
        verificationDocumentMetadata,
      ),
      approvalStatus: updatedProfile.approvalStatus,
    },
    message: "Verification document uploaded successfully and submitted for review.",
  });
});

export const getMyVerificationDocument = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user.id });
  if (!profile) {
    throw new AppError("Provider profile not found", 404);
  }

  const index = parseDocumentIndex(req.params.index);
  if (!profile.verificationDocuments || index >= profile.verificationDocuments.length) {
    throw new AppError("Verification document not found", 404);
  }

  return streamDocumentFromUrl(profile.verificationDocuments[index], res);
});

export const getAdminVerificationDocument = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id);
  if (!profile) {
    throw new AppError("Provider profile not found", 404);
  }

  const index = parseDocumentIndex(req.params.index);
  if (!profile.verificationDocuments || index >= profile.verificationDocuments.length) {
    throw new AppError("Verification document not found", 404);
  }

  return streamDocumentFromUrl(profile.verificationDocuments[index], res);
});

export const deleteVerificationDocument = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user.id });
  if (!profile) throw new AppError("Provider profile not found", 404);

  const index = parseDocumentIndex(req.params.index);
  if (!profile.verificationDocuments || index >= profile.verificationDocuments.length) {
    throw new AppError("Verification document not found", 404);
  }

  const document = profile.verificationDocuments[index];
  let deletionResult;
  try {
    deletionResult = await destroyPrivateDocument(document);
  } catch {
    throw new AppError("Unable to delete verification document from storage", 502);
  }

  if (deletionResult?.result && !["ok", "not found"].includes(deletionResult.result)) {
    throw new AppError("Unable to delete verification document from storage", 502);
  }

  const updatedProfile = await ProviderProfile.findOneAndUpdate(
    { user: req.user.id, verificationDocuments: document },
    { $pull: { verificationDocuments: document } },
    { new: true },
  );

  if (!updatedProfile) {
    throw new AppError("Verification document reference could not be removed", 502);
  }

  sendSuccess(res, {
    data: {
      verificationDocuments: updatedProfile.verificationDocuments.map(
        verificationDocumentMetadata,
      ),
    },
    message: "Verification document deleted",
  });
});


