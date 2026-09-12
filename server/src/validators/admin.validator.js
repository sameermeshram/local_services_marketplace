import { body } from "express-validator";

export const rejectProviderRules = [
  body("reason")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Rejection reason must be under 500 characters"),
];
