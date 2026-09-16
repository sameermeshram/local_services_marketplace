import { Router } from "express";
import * as providerController from "../controllers/provider.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateAvailabilityRules,
  updateProfileRules,
} from "../validators/provider.validator.js";
import * as reviewController from "../controllers/review.controller.js";
import * as mediaController from "../controllers/media.controller.js";
import { upload } from "../config/multer.js";

const router = Router();

router.get("/", providerController.getProviders);
router.get("/:id/reviews", reviewController.getProviderReviews);
router.get("/:id", providerController.getProviderById);

router.use(protect, authorize("provider"));
router.get("/me/profile", providerController.getMyProfile);
router.post("/me/photos", upload.single("photo"), mediaController.uploadProviderPhoto);
router.post(
  "/me/verification-documents",
  upload.single("document"),
  mediaController.uploadVerificationDocument
);
router.patch("/me/availability", validate(updateAvailabilityRules), providerController.updateAvailability);
router.patch("/me/profile", validate(updateProfileRules), providerController.updateProfile);

export default router;
