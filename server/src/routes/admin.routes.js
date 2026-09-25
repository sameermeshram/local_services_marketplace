import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as mediaController from "../controllers/media.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { rejectProviderRules } from "../validators/admin.validator.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/providers/pending", adminController.getPendingProviders);
router.get("/providers/:id/verification-documents/:index", mediaController.getAdminVerificationDocument);
router.patch("/providers/:id/approve", adminController.approveProvider);
router.patch(
  "/providers/:id/reject",
  validate(rejectProviderRules),
  adminController.rejectProvider,
);

export default router;
