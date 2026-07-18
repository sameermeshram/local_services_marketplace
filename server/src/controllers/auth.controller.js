import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from "../utils/cookies.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.registerUser(req.body);

  setAuthCookies(res, { accessToken, refreshToken });

  sendSuccess(res, {
    statusCode: 201,
    message: "Registration successful",
    data: { user: user.toAuthJSON() },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

  setAuthCookies(res, { accessToken, refreshToken });

  sendSuccess(res, {
    message: "Login successful",
    data: { user: user.toAuthJSON() },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);
  clearAuthCookies(res);

  sendSuccess(res, { message: "Logout successful" });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const { accessToken, refreshToken: newRefreshToken, user } =
    await authService.refreshSession(refreshToken);

  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  sendSuccess(res, {
    message: "Token refreshed",
    data: { user: user.toAuthJSON() },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  sendSuccess(res, {
    message: "User profile fetched",
    data: { user: user.toAuthJSON() },
  });
});
