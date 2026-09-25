import { User } from "../models/User.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { sendVerificationEmail } from "../utils/email.js";

async function issueTokens(user) {
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.setRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken, user };
}

export async function registerUser(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    pincode: payload.pincode,
    password: payload.password,
    role: payload.role,
    serviceType: payload.role === "provider" ? payload.serviceType : undefined,
    termsAcceptedAt: new Date(),
  });

  if (user.role === "provider") {
    await ProviderProfile.create({ user: user._id });
  }

  // Generate verification token and send email
  const verificationToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email (non-blocking - don't fail registration if email fails)
  sendVerificationEmail(user.email, user.name, verificationToken).catch((error) => {
    console.error("Failed to send verification email:", error.message);
  });

  return issueTokens(user);
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshTokenHash");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  return issueTokens(user);
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token required", 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.sub).select("+refreshTokenHash");
  if (!user || !user.isActive) {
    throw new AppError("User not found", 401);
  }

  if (!user.compareRefreshToken(refreshToken)) {
    throw new AppError("Refresh token revoked", 401);
  }

  return issueTokens(user);
}

export async function logoutUser(userId) {
  const user = await User.findById(userId).select("+refreshTokenHash");
  if (!user) return;

  user.clearRefreshToken();
  await user.save({ validateBeforeSave: false });
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function verifyEmail(token) {
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  // Hash the token to compare with stored hash
  const crypto = await import("crypto");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  user.verifyEmail();
  await user.save({ validateBeforeSave: false });

  return user;
}

export async function resendVerificationEmail(email) {
  // Generic response to prevent email enumeration
  const genericResponse = { message: "If an unverified account exists, a verification email has been sent" };

  if (!email) {
    return genericResponse;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+verificationToken +verificationExpires");

  // Don't reveal whether the email exists
  if (!user) {
    return genericResponse;
  }

  // Don't send email if already verified
  if (user.isVerified) {
    return genericResponse;
  }

  // Generate new verification token (invalidates old one)
  const verificationToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, user.name, verificationToken).catch((error) => {
    console.error("Failed to send verification email:", error.message);
  });

  return genericResponse;
}
