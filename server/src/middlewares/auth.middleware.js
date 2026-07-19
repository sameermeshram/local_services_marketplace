import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { getAccessTokenFromRequest } from "../utils/cookies.js";
import { User } from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new AppError("User not found or inactive", 401);
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});
