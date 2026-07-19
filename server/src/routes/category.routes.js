import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { USER_ROLES } from "../constants/roles.constant.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  categoryIdRules,
  createCategoryRules,
  updateCategoryRules,
} from "../validators/category.validator.js";

const router = Router();

router.get("/", categoryController.getCategories);
router.get("/:id", validate(categoryIdRules), categoryController.getCategoryById);

router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(createCategoryRules),
  categoryController.createCategory
);

router.put(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(updateCategoryRules),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(categoryIdRules),
  categoryController.deleteCategory
);

export default router;
