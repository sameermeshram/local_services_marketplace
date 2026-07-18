import { body } from "express-validator";
import { SERVICE_TYPES } from "../models/User.js";

const passwordRules = body("password")
  .trim()
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[A-Za-z]/)
  .withMessage("Password must contain at least one letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number");

export const registerRules = [
  body("role").isIn(["customer", "provider"]).withMessage("Role must be customer or provider"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("pincode")
    .trim()
    .matches(/^\d{5,6}$/)
    .withMessage("Pincode must be 5 or 6 digits"),
  passwordRules,
  body("termsAccepted")
    .custom((value) => value === true || value === "true")
    .withMessage("You must accept the terms of service"),
  body("serviceType")
    .if(body("role").equals("provider"))
    .isIn(SERVICE_TYPES)
    .withMessage(`Service type must be one of: ${SERVICE_TYPES.join(", ")}`),
];

export const loginRules = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];
