import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createReviewRules } from "../validators/review.validator.js";

const router = Router();

router.get("/me", protect, authorize("customer"), reviewController.getMyReviews);
router.post(
  "/bookings/:bookingId",
  protect,
  authorize("customer"),
  validate(createReviewRules),
  reviewController.createReview,
);

export default router;
