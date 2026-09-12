import { body } from "express-validator";

export const createBookingRules = [
  body("providerId").isMongoId().withMessage("A valid provider is required"),
  body("service").optional().isString().trim().notEmpty().withMessage("Service is invalid"),
  body("date").isString().trim().notEmpty().withMessage("Date is required"),
  body("timeSlot")
    .isIn(["morning", "afternoon", "evening"])
    .withMessage("Time slot is invalid"),
  body("address").isString().trim().notEmpty().withMessage("Service address is required"),
  body("details")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 2000 })
    .withMessage("Job details are required and must be under 2000 characters"),
];

export const updateBookingStatusRules = [
  body("status")
    .isIn(["accepted", "rejected", "in_progress", "completed"])
    .withMessage("Booking status is invalid"),
];

export const rescheduleBookingRules = [
  body("date").isString().trim().notEmpty().withMessage("Date is required"),
  body("timeSlot")
    .isIn(["morning", "afternoon", "evening"])
    .withMessage("Time slot is invalid"),
];
