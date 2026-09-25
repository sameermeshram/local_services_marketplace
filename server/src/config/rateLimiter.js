import rateLimit from "express-rate-limit";

// Authentication rate limiter: 100 requests per 15 minutes
// Prevents brute-force attacks on login/register endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    data: null,
    errors: [],
  },
});

// Booking creation rate limiter: 10 requests per minute
// Prevents booking spam and abuse
export const bookingCreateRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking requests, please wait before creating another",
    data: null,
    errors: [],
  },
});

// Provider discovery rate limiter: 30 requests per minute
// Prevents scraping of provider data
export const providerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down",
    data: null,
    errors: [],
  },
});

// Notification rate limiter: 30 requests per minute
// Prevents notification polling abuse
export const notificationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down",
    data: null,
    errors: [],
  },
});

// Verification resend rate limiter: 3 requests per hour
// Prevents email spam and abuse of verification system
export const verificationResendRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please wait before requesting another verification email",
    data: null,
    errors: [],
  },
});
