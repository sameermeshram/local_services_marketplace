import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginRules, registerRules } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerRules), authController.register);
router.post("/login", validate(loginRules), authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", protect, authController.getMe);

export default router;
