import { body } from "express-validator";

export const updateAvailabilityRules = [
  body("isAvailable").isBoolean().withMessage("Availability must be true or false"),
];

export const updateProfileRules = [
  body("bio").optional().isString().isLength({ max: 2000 }).withMessage("Bio is too long").escape(),
  body("serviceType")
    .optional()
    .isIn(["plumbing", "electrical", "hvac", "carpentry", "cleaning"])
    .withMessage("Service type is invalid"),
  body("pricePerVisit").optional().isFloat({ min: 0 }).withMessage("Price must be zero or greater"),
  body("yearsExperience").optional().isInt({ min: 0, max: 80 }).withMessage("Experience is invalid"),
  body("serviceAreas").optional().isArray().withMessage("Service areas must be a list"),
  body("serviceAreas.*")
    .custom((area) => {
      if (typeof area === "string") return /^\d{5,6}$/.test(area.trim());
      if (!area || typeof area !== "object" || Array.isArray(area)) return false;
      if (Object.keys(area).some((key) => !["city", "pincode"].includes(key))) return false;
      return (
        typeof area.pincode === "string" &&
        /^\d{5,6}$/.test(area.pincode.trim()) &&
        (area.city === undefined ||
          (typeof area.city === "string" && area.city.trim().length <= 80))
      );
    })
    .withMessage("Each service area must include a valid 5 or 6 digit pincode"),
  body("serviceName").optional().isString().trim().isLength({ max: 120 }).withMessage("Service name is too long").escape(),
  body("serviceDescription").optional().isString().trim().isLength({ max: 500 }).withMessage("Service description is too long").escape(),
  body("servicePrice").optional().isFloat({ min: 0 }).withMessage("Service price must be positive"),
];
