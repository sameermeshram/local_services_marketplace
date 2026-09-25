import { body } from "express-validator";

export const createReviewRules = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isString().trim().isLength({ max: 2000 }).withMessage("Comment is too long").escape(),
];
