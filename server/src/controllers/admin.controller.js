import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import {
  normalizeVerificationDocument,
  verificationDocumentMetadata,
} from "../utils/verificationDocument.js";

const pendingFilter = {
  $or: [
    { approvalStatus: "pending" },
    { approvalStatus: { $exists: false }, isApproved: false },
  ],
};

function serializeProvider(provider) {
  const data = provider.toObject();
  data.verificationDocuments = (provider.verificationDocuments || []).map(
    verificationDocumentMetadata,
  );
  return data;
}

export const getPendingProviders = asyncHandler(async (_req, res) => {
  const providers = await ProviderProfile.find(pendingFilter)
    .populate("user", "name email phone pincode isActive")
    .populate("categories", "name slug")
    .sort({ createdAt: 1 });

  const safeProviders = providers.map(serializeProvider);

  sendSuccess(res, { data: { providers: safeProviders } });
});

export const approveProvider = asyncHandler(async (req, res) => {
  const existingProvider = await ProviderProfile.findById(req.params.id);
  if (!existingProvider) throw new AppError("Provider profile not found", 404);

  const hasValidDocument = (existingProvider.verificationDocuments || []).some(
    (document) => normalizeVerificationDocument(document),
  );
  if (!hasValidDocument) {
    throw new AppError("Provider must submit a verification document before approval", 409);
  }

  const provider = await ProviderProfile.findOneAndUpdate(
    { _id: req.params.id, verificationDocuments: { $ne: [] } },
    { $set: { isApproved: true, approvalStatus: "approved", approvalReason: "" } },
    { new: true },
  ).populate("user", "name email");

  if (!provider) {
    throw new AppError("Provider verification documents changed before approval", 409);
  }

  sendSuccess(res, {
    data: { provider: serializeProvider(provider) },
    message: "Provider approved",
  });
});

export const rejectProvider = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findByIdAndUpdate(
    req.params.id,
    {
      isApproved: false,
      approvalStatus: "rejected",
      approvalReason: req.body.reason || "Provider did not meet approval requirements",
    },
    { new: true },
  ).populate("user", "name email");

  if (!provider) throw new AppError("Provider profile not found", 404);

  sendSuccess(res, {
    data: { provider: serializeProvider(provider) },
    message: "Provider rejected",
  });
});
