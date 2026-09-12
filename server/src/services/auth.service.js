import { User } from "../models/User.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

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
