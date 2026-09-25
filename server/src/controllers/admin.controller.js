import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { verificationDocumentMetadata } from "../utils/verificationDocument.js";

const pendingFilter = {
  $or: [
    { approvalStatus: "pending" },
    { approvalStatus: { $exists: false }, isApproved: false },
  ],
};

export const getPendingProviders = asyncHandler(async (_req, res) => {
  const providers = await ProviderProfile.find(pendingFilter)
    .populate("user", "name email phone pincode isActive")
    .populate("categories", "name slug")
    .sort({ createdAt: 1 });

  const safeProviders = providers.map((provider) => {
    const data = provider.toObject();
    data.verificationDocuments = (provider.verificationDocuments || []).map(
      verificationDocumentMetadata,
    );
    return data;
  });

  sendSuccess(res, { data: { providers: safeProviders } });
});

export const approveProvider = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findByIdAndUpdate(
    req.params.id,
    { isApproved: true, approvalStatus: "approved", approvalReason: "" },
    { new: true },
  ).populate("user", "name email");

  if (!provider) throw new AppError("Provider profile not found", 404);

  sendSuccess(res, { data: { provider }, message: "Provider approved" });
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

  sendSuccess(res, { data: { provider }, message: "Provider rejected" });
});
