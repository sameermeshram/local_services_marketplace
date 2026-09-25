import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginRules,
  registerRules,
  verifyEmailRules,
  resendVerificationRules,
} from "../validators/auth.validator.js";
import { verificationResendRateLimiter } from "../config/rateLimiter.js";

const router = Router();

router.post("/register", validate(registerRules), authController.register);
router.post("/login", validate(loginRules), authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", protect, authController.getMe);
router.post("/verify-email", validate(verifyEmailRules), authController.verifyEmail);
router.post(
  "/resend-verification",
  verificationResendRateLimiter,
  validate(resendVerificationRules),
  authController.resendVerification
);

export default router;
