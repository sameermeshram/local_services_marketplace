import { body, param } from "express-validator";

export const categoryIdRules = [
  param("id").isMongoId().withMessage("Valid category id is required"),
];

export const createCategoryRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Category name must be between 2 and 80 characters"),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must contain lowercase letters, numbers, and hyphens only"),
  body("icon")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Icon must be 80 characters or fewer"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or fewer"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

export const updateCategoryRules = [
  ...categoryIdRules,
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Category name must be between 2 and 80 characters"),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must contain lowercase letters, numbers, and hyphens only"),
  body("icon")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Icon must be 80 characters or fewer"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be 500 characters or fewer"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a positive integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];
