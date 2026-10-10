import { query } from "express-validator";

export const paginationOnlyRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50"),
];

export const customerBookingListRules = [
  ...paginationOnlyRules,
  query("statusGroup")
    .optional()
    .isIn(["active", "past"])
    .withMessage("Status group must be active or past"),
];
