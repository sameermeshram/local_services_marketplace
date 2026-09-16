import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { User } from "../models/User.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { Category } from "../models/Category.js";
import mongoose from "mongoose";

const approvedFilter = {
  $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false }, isApproved: true }],
};

function serializeProvider(profile) {
  return {
    id: profile._id,
    userId: profile.user?._id,
    name: profile.user?.name,
    trade: profile.categories?.[0]?.name || profile.user?.serviceType || "Local service provider",
    bio: profile.bio,
    price: profile.pricePerVisit,
    rating: profile.ratingAverage,
    reviewCount: profile.reviewCount,
    completedJobs: profile.completedJobs,
    available: profile.isAvailable,
    image: profile.profileImage,
    imageAlt: profile.user?.name ? `${profile.user.name} provider profile` : "Provider profile",
    categories: profile.categories,
    services: profile.services,
    serviceAreas: profile.serviceAreas,
  };
}

export const getProviders = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
  const filter = { ...approvedFilter };

  if (req.query.available === "true") filter.isAvailable = true;
  if (req.query.pincode) filter["serviceAreas.pincode"] = String(req.query.pincode).trim();
  if (req.query.city) filter["serviceAreas.city"] = new RegExp(String(req.query.city).trim(), "i");

  if (req.query.category) {
    const category = mongoose.Types.ObjectId.isValid(req.query.category)
      ? req.query.category
      : await Category.findOne({ slug: String(req.query.category).toLowerCase(), isActive: true }).select("_id");

    if (!category) return sendSuccess(res, { data: { providers: [], pagination: { page, limit, total: 0, pages: 0 } } });
    filter.categories = category._id || category;
  }

  let sortOption = { ratingAverage: -1, createdAt: -1 };
  if (req.query.sort === "rating") {
    sortOption = { ratingAverage: -1, reviewCount: -1 };
  } else if (req.query.sort === "newest") {
    sortOption = { createdAt: -1 };
  }

  const [profiles, total] = await Promise.all([
    ProviderProfile.find(filter)
      .populate("user", "name serviceType")
      .populate("categories", "name slug")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit),
    ProviderProfile.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: {
      providers: profiles.map(serializeProvider),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getProviderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError("Provider not found", 404);
  }

  const profile = await ProviderProfile.findOne({ _id: req.params.id, ...approvedFilter })
    .populate("user", "name serviceType pincode")
    .populate("categories", "name slug");

  if (!profile) throw new AppError("Provider not found", 404);
  sendSuccess(res, { data: { provider: serializeProvider(profile) } });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user.id })
    .populate("user", "name email phone pincode serviceType")
    .populate("categories", "name slug");

  if (!profile) throw new AppError("Provider profile not found", 404);
  sendSuccess(res, { data: { profile } });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isAvailable: req.body.isAvailable },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("Provider not found", 404);

  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user.id },
    { isAvailable: user.isAvailable },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  sendSuccess(res, {
    data: { isAvailable: profile.isAvailable },
    message: "Availability updated",
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      serviceType: req.body.serviceType,
    },
    { new: true, runValidators: true },
  );

  if (!user) throw new AppError("Provider not found", 404);

  const serviceAreas = (req.body.serviceAreas || []).map((area) =>
    typeof area === "string" ? { city: "", pincode: area } : area,
  );
  const category = await Category.findOne({ slug: req.body.serviceType, isActive: true }).select("_id");
  const serviceName = req.body.serviceName?.trim() || req.body.serviceType;
  const servicePrice = Number(req.body.servicePrice ?? req.body.pricePerVisit);
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: req.user.id },
    {
      bio: req.body.bio,
      pricePerVisit: req.body.pricePerVisit,
      yearsExperience: req.body.yearsExperience,
      serviceAreas,
      categories: category ? [category._id] : [],
      services: [{
        name: serviceName,
        description: req.body.serviceDescription?.trim() || "",
        price: servicePrice,
      }],
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  sendSuccess(res, { data: { user: user.toAuthJSON(), profile }, message: "Profile updated" });
});
