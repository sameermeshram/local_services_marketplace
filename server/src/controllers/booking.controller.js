import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { Booking } from "../models/Booking.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../services/notification.service.js";

export const createBooking = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({
    _id: req.body.providerId,
    isApproved: true,
    approvalStatus: "approved",
    isAvailable: true,
  }).populate("user", "name");

  if (!provider) {
    throw new AppError("Provider is not approved or available", 400);
  }

  const requestedService = req.body.service?.trim();
  const matchingService = provider.services.find(
    (service) => service.name.toLowerCase() === requestedService?.toLowerCase(),
  );

  if (provider.services.length > 0 && !matchingService) {
    throw new AppError("Selected service is not offered by this provider", 400);
  }

  const booking = await Booking.create({
    customer: req.user.id,
    provider: provider._id,
    providerName: provider.user.name,
    service: matchingService?.name || requestedService || provider.user.serviceType,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    address: req.body.address,
    details: req.body.details,
  });

  await createNotification({
    recipient: provider.user._id,
    type: "booking_created",
    title: "New booking request",
    message: `${req.user.name || "A customer"} requested ${booking.service}.`,
    booking: booking._id,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Booking created",
    data: { booking },
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ customer: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, { data: { bookings } });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    customer: req.user.id,
    status: { $in: ["pending", "accepted"] },
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking cannot be cancelled", data: null, errors: [] });
  }

  booking.status = "cancelled";
  await booking.save();
  const provider = await ProviderProfile.findById(booking.provider).populate("user", "_id");
  if (provider) {
    await createNotification({
      recipient: provider.user._id,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `${booking.providerName} booking was cancelled by the customer.`,
      booking: booking._id,
    });
  }
  sendSuccess(res, { data: { booking }, message: "Booking cancelled" });
});

export const rescheduleBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    customer: req.user.id,
    status: { $in: ["pending", "accepted"] },
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking cannot be rescheduled", data: null, errors: [] });
  }

  booking.date = req.body.date;
  booking.timeSlot = req.body.timeSlot;
  await booking.save();
  const provider = await ProviderProfile.findById(booking.provider).populate("user", "_id");
  if (provider) {
    await createNotification({
      recipient: provider.user._id,
      type: "booking_rescheduled",
      title: "Booking rescheduled",
      message: `A customer rescheduled ${booking.service}.`,
      booking: booking._id,
    });
  }
  sendSuccess(res, { data: { booking }, message: "Booking rescheduled" });
});

function providerBookingFilter(req) {
  return { provider: req.providerProfile._id };
}

export const getProviderBookings = asyncHandler(async (req, res) => {
  req.providerProfile = await ProviderProfile.findOne({ user: req.user.id });
  if (!req.providerProfile) throw new AppError("Provider profile not found", 404);

  const bookings = await Booking.find(providerBookingFilter(req))
    .populate("customer", "name email phone")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: { bookings } });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  req.providerProfile = await ProviderProfile.findOne({ user: req.user.id });
  if (!req.providerProfile) throw new AppError("Provider profile not found", 404);

  const booking = await Booking.findOne({
    _id: req.params.id,
    ...providerBookingFilter(req),
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
      data: null,
      errors: [],
    });
  }

  const allowedTransitions = {
    pending: ["accepted", "rejected"],
    accepted: ["in_progress"],
    in_progress: ["completed"],
  };
  if (!allowedTransitions[booking.status]?.includes(req.body.status)) {
    throw new AppError(`Cannot change booking from ${booking.status} to ${req.body.status}`, 400);
  }

  booking.status = req.body.status;
  await booking.save();
  await createNotification({
    recipient: booking.customer,
    type: "booking_status",
    title: "Booking status updated",
    message: `Your ${booking.service} booking is now ${booking.status.replace("_", " ")}.`,
    booking: booking._id,
  });

  sendSuccess(res, { data: { booking }, message: "Booking status updated" });
});
