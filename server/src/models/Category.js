import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    icon: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    sortOrder: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
categorySchema.index({ slug: 1, isActive: 1 });

categorySchema.virtual("providerProfiles", {
  ref: "ProviderProfile",
  localField: "_id",
  foreignField: "category",
});

categorySchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Category = mongoose.model("Category", categorySchema);
