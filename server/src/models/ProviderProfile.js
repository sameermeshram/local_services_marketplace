import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const serviceAreaSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true, maxlength: 80, default: "" },
    pincode: { type: String, required: true, trim: true, match: /^\d{5,6}$/ },
  },
  { _id: false },
);

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, trim: true, maxlength: 120, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    services: { type: [serviceSchema], default: [] },
    pricePerVisit: { type: Number, min: 0, default: 0 },
    yearsExperience: { type: Number, min: 0, max: 80, default: 0 },
    serviceAreas: { type: [serviceAreaSchema], default: [] },
    profileImage: { type: String, default: null },
    photos: { type: [String], default: [] },
    verificationDocuments: { type: [String], default: [] },
    isApproved: { type: Boolean, default: false, index: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvalReason: { type: String, trim: true, maxlength: 500, default: "" },
    isAvailable: { type: Boolean, default: true, index: true },
    ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    completedJobs: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

providerProfileSchema.index({ categories: 1, isApproved: 1, isAvailable: 1 });
providerProfileSchema.index({ "serviceAreas.pincode": 1, isApproved: 1 });
providerProfileSchema.index({ "serviceAreas.city": 1, isApproved: 1 });

export const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);
