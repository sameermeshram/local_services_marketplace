import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { Booking } from "../models/Booking.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { Review } from "../models/Review.js";
import mongoose from "mongoose";

export const createReview = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    customer: req.user.id,
    status: "completed",
  });

  if (!booking) throw new AppError("Only completed bookings can be reviewed", 400);

  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) throw new AppError("This booking has already been reviewed", 409);

  const review = await Review.create({
    booking: booking._id,
    customer: req.user.id,
    provider: booking.provider,
    rating: req.body.rating,
    comment: req.body.comment || "",
  });

  const provider = await ProviderProfile.findById(booking.provider);
  if (provider) {
    const rawAverage =
      (provider.ratingAverage * provider.reviewCount + review.rating) /
      (provider.reviewCount + 1);
    const cleanAverage = Math.min(Math.max(Math.round(rawAverage * 10) / 10, 0), 5);
    provider.ratingAverage = cleanAverage;
    provider.reviewCount += 1;
    await provider.save();
  }

  sendSuccess(res, { statusCode: 201, data: { review }, message: "Review submitted" });
});

export const getProviderReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError("Provider not found", 404);
  }

  const reviews = await Review.find({ provider: req.params.id })
    .populate("customer", "name")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: { reviews } });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, { data: { reviews } });
});
