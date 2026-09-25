import { body } from "express-validator";

function isFutureDate(value) {
  const bookingDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(bookingDate.getTime())) {
    throw new Error("Invalid date format");
  }

  if (bookingDate < today) {
    throw new Error("Booking date cannot be in the past");
  }

  return true;
}

export const createBookingRules = [
  body("providerId").isMongoId().withMessage("A valid provider is required"),
  body("service").optional().isString().trim().notEmpty().withMessage("Service is invalid").escape(),
  body("date")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .custom(isFutureDate),
  body("timeSlot")
    .isIn(["morning", "afternoon", "evening"])
    .withMessage("Time slot is invalid"),
  body("address")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Service address is required")
    .isLength({ max: 500 })
    .withMessage("Address must be under 500 characters")
    .escape(),
  body("details")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 2000 })
    .withMessage("Job details are required and must be under 2000 characters")
    .escape(),
];

export const updateBookingStatusRules = [
  body("status")
    .isIn(["accepted", "rejected", "in_progress", "completed"])
    .withMessage("Booking status is invalid"),
];

export const rescheduleBookingRules = [
  body("date")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .custom(isFutureDate),
  body("timeSlot")
    .isIn(["morning", "afternoon", "evening"])
    .withMessage("Time slot is invalid"),
];
