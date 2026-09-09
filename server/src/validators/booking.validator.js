import { body } from "express-validator";

export const createBookingRules = [
  body("providerId").isString().trim().notEmpty().withMessage("Provider is required"),
  body("providerName").isString().trim().notEmpty().withMessage("Provider name is required"),
  body("service").isString().trim().notEmpty().withMessage("Service is required"),
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
    .isIn(["accepted", "rejected", "completed"])
    .withMessage("Booking status is invalid"),
];

export const rescheduleBookingRules = [
  body("date").isString().trim().notEmpty().withMessage("Date is required"),
  body("timeSlot")
    .isIn(["morning", "afternoon", "evening"])
    .withMessage("Time slot is invalid"),
];
