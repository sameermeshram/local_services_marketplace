import { Router } from "express";
import * as providerController from "../controllers/provider.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateAvailabilityRules,
  updateProfileRules,
} from "../validators/provider.validator.js";

const router = Router();

router.use(protect, authorize("provider"));
router.patch("/me/availability", validate(updateAvailabilityRules), providerController.updateAvailability);
router.patch("/me/profile", validate(updateProfileRules), providerController.updateProfile);

export default router;
