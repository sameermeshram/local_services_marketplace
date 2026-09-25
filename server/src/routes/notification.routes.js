import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { notificationRateLimiter } from "../config/rateLimiter.js";

const router = Router();

router.use(protect);
router.get("/", notificationRateLimiter, notificationController.getNotifications);
router.patch("/read-all", notificationRateLimiter, notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
