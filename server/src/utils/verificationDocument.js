import { AppError } from "./AppError.js";
import { cloudinary } from "../config/cloudinary.js";

export function parseDocumentIndex(value) {
  if (!/^\d+$/.test(String(value))) {
    throw new AppError("Document index must be a non-negative integer", 400);
  }

  return Number(value);
}

function parseLegacyCloudinaryUrl(documentUrl) {
  let pathname;
  try {
    pathname = new URL(documentUrl).pathname;
  } catch {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const privateIndex = segments.indexOf("private");
  if (privateIndex < 0) return null;

  const versionIndex = segments.findIndex(
    (segment, index) => index > privateIndex && /^v\d+$/.test(segment),
  );
  if (versionIndex < 0 || versionIndex === segments.length - 1) return null;

  const resourceType = segments[0];
  if (!("image" === resourceType || "raw" === resourceType)) return null;

  const filename = decodeURIComponent(segments.slice(versionIndex + 1).join("/"));
  const extensionIndex = filename.lastIndexOf(".");
  const format = extensionIndex > -1 ? filename.slice(extensionIndex + 1) : undefined;
  const publicId = extensionIndex > -1 ? filename.slice(0, extensionIndex) : filename;

  return { publicId, format, resourceType };
}

export function normalizeVerificationDocument(document) {
  if (typeof document === "string") {
    const legacy = parseLegacyCloudinaryUrl(document);
    return legacy ? { ...legacy, legacyUrl: document } : null;
  }

  if (!document?.publicId) return null;

  return {
    publicId: document.publicId,
    format: document.format,
    resourceType: document.resourceType || "raw",
    originalFilename: document.originalFilename,
    uploadedAt: document.uploadedAt,
    id: document._id?.toString(),
  };
}

export function verificationDocumentMetadata(document, index) {
  const normalized = normalizeVerificationDocument(document);
  return {
    index,
    id: normalized?.id || null,
    originalFilename: normalized?.originalFilename || null,
    format: normalized?.format || null,
    resourceType: normalized?.resourceType || null,
    uploadedAt: normalized?.uploadedAt || null,
  };
}

export function getPrivateDocumentUrl(document) {
  const normalized = normalizeVerificationDocument(document);
  if (!normalized) {
    throw new AppError("Verification document storage metadata is invalid", 502);
  }

  return cloudinary.utils.private_download_url(
    normalized.publicId,
    normalized.format,
    {
      resource_type: normalized.resourceType,
      type: "private",
      secure: true,
      attachment: false,
    },
  );
}

export function destroyPrivateDocument(document) {
  const normalized = normalizeVerificationDocument(document);
  if (!normalized) {
    throw new AppError("Verification document storage metadata is invalid", 502);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      normalized.publicId,
      {
        resource_type: normalized.resourceType,
        type: "private",
        invalidate: true,
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
}
