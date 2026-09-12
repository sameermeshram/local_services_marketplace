import { body } from "express-validator";
import { SERVICE_TYPES } from "../models/User.js";
import { USER_ROLES } from "../constants/roles.constant.js";

const passwordRules = body("password")
  .trim()
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number")
  .matches(/[!@#$%^&*(),.?":{}|<>_\-[\]\\;/`~+=]/)
  .withMessage("Password must contain at least one special character");

export const registerRules = [
  body("role")
    .isIn([USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER])
    .withMessage("Role must be customer or provider"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("phone")
    .trim()
    .matches(/^[+]?[0-9\s()-]{7,20}$/)
    .withMessage("Valid phone number is required"),
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
