import { Router } from "express";
import * as bookingController from "../controllers/booking.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBookingRules,
  rescheduleBookingRules,
  updateBookingStatusRules,
} from "../validators/booking.validator.js";
import { authorize } from "../middlewares/role.middleware.js";
import * as reviewController from "../controllers/review.controller.js";
import { createReviewRules } from "../validators/review.validator.js";
import { bookingCreateRateLimiter } from "../config/rateLimiter.js";

const router = Router();

router.use(protect);
router.post("/", bookingCreateRateLimiter, authorize("customer"), validate(createBookingRules), bookingController.createBooking);
router.get("/me", bookingController.getMyBookings);
router.get("/provider", authorize("provider"), bookingController.getProviderBookings);
router.patch("/:id/cancel", authorize("customer"), bookingController.cancelBooking);
router.patch(
  "/:id/reschedule",
  authorize("customer"),
  validate(rescheduleBookingRules),
  bookingController.rescheduleBooking
);
router.patch(
  "/:id/status",
  authorize("provider"),
  validate(updateBookingStatusRules),
  bookingController.updateBookingStatus
);
router.post(
  "/:id/reviews",
  authorize("customer"),
  validate(createReviewRules),
  (req, res, next) => {
    req.params.bookingId = req.params.id;
    return reviewController.createReview(req, res, next);
  },
);

export default router;
