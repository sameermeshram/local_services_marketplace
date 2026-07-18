import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const SERVICE_TYPES = ["plumbing", "electrical", "hvac", "carpentry", "cleaning"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["customer", "provider"], required: true },
    serviceType: {
      type: String,
      enum: SERVICE_TYPES,
      required() {
        return this.role === "provider";
      },
    },
    avatarUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    termsAcceptedAt: { type: Date, required: true },
    refreshTokenHash: { type: String, select: false, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.setRefreshToken = function setRefreshToken(refreshToken) {
  this.refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
};

userSchema.methods.clearRefreshToken = function clearRefreshToken() {
  this.refreshTokenHash = null;
};

userSchema.methods.compareRefreshToken = function compareRefreshToken(refreshToken) {
  if (!this.refreshTokenHash) return false;
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  return this.refreshTokenHash === hash;
};

userSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    pincode: this.pincode,
    role: this.role,
    serviceType: this.serviceType ?? null,
    avatarUrl: this.avatarUrl,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
export { SERVICE_TYPES };
