import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { User } from "../models/User.js";

export const updateAvailability = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isAvailable: req.body.isAvailable },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("Provider not found", 404);

  sendSuccess(res, {
    data: { isAvailable: user.isAvailable },
    message: "Availability updated",
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      bio: req.body.bio,
      serviceType: req.body.serviceType,
      pricePerVisit: req.body.pricePerVisit,
      yearsExperience: req.body.yearsExperience,
      serviceAreas: req.body.serviceAreas,
    },
    { new: true, runValidators: true },
  );

  if (!user) throw new AppError("Provider not found", 404);

  sendSuccess(res, { data: { user: user.toAuthJSON() }, message: "Profile updated" });
});
