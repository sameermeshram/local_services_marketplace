import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

export function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new AppError("Validation failed", 400, errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })))
      );
    }

    next();
  };
}
