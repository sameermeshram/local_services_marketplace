import { env } from "../config/env.js";
import { AUTH_COOKIE_NAMES } from "../constants/auth.constant.js";

const isProduction = env.nodeEnv === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/",
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, baseCookieOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, baseCookieOptions);
}

export function getAccessTokenFromRequest(req) {
  if (req.cookies?.[AUTH_COOKIE_NAMES.ACCESS_TOKEN]) {
    return req.cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
  }
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN] ?? null;
}
