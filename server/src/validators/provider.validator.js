import { body } from "express-validator";

export const updateAvailabilityRules = [
  body("isAvailable").isBoolean().withMessage("Availability must be true or false"),
];

export const updateProfileRules = [
  body("bio").optional().isString().isLength({ max: 2000 }).withMessage("Bio is too long"),
  body("serviceType")
    .optional()
    .isIn(["plumbing", "electrical", "hvac", "carpentry", "cleaning"])
    .withMessage("Service type is invalid"),
  body("pricePerVisit").optional().isFloat({ min: 0 }).withMessage("Price must be positive"),
  body("yearsExperience").optional().isInt({ min: 0, max: 80 }).withMessage("Experience is invalid"),
  body("serviceAreas").optional().isArray().withMessage("Service areas must be a list"),
];
