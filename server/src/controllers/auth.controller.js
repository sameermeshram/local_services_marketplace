import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from "../utils/cookies.js";
import * as authService from "../services/auth.service.js";
import { AUTH_MESSAGES } from "../constants/auth.constant.js";

export const register = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.registerUser(req.body);

  setAuthCookies(res, { accessToken, refreshToken });

  sendSuccess(res, {
    statusCode: 201,
    message: AUTH_MESSAGES.REGISTERED,
    data: { user: user.toAuthJSON() },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

  setAuthCookies(res, { accessToken, refreshToken });

  sendSuccess(res, {
    message: AUTH_MESSAGES.LOGGED_IN,
    data: { user: user.toAuthJSON() },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);
  clearAuthCookies(res);

  sendSuccess(res, { message: AUTH_MESSAGES.LOGGED_OUT });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const { accessToken, refreshToken: newRefreshToken, user } =
    await authService.refreshSession(refreshToken);

  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  sendSuccess(res, {
    message: AUTH_MESSAGES.REFRESHED,
    data: { user: user.toAuthJSON() },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  sendSuccess(res, {
    message: AUTH_MESSAGES.ME,
    data: { user: user.toAuthJSON() },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await authService.verifyEmail(token);

  sendSuccess(res, {
    message: "Email verified successfully",
    data: { user: user.toAuthJSON() },
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendVerificationEmail(email);

  sendSuccess(res, {
    message: result.message,
    data: null,
  });
});
