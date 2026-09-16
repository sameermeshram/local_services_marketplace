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

  if (provider.user._id.toString() === req.user.id) {
    throw new AppError("You cannot book your own service profile", 400);
  }

  const requestedService = req.body.service?.trim();
  const matchingService = provider.services.find(
    (service) => service.name.toLowerCase() === requestedService?.toLowerCase(),
  );

  if (provider.services.length > 0 && !matchingService) {
    throw new AppError("Selected service is not offered by this provider", 400);
  }

  const slotConflict = await Booking.findOne({
    provider: provider._id,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    status: { $in: ["pending", "accepted", "in_progress"] },
  });

  if (slotConflict) {
    throw new AppError("The provider already has a booking reserved for this date and time slot", 409);
  }

  let booking;
  try {
    booking = await Booking.create({
      customer: req.user.id,
      provider: provider._id,
      providerName: provider.user.name,
      service: matchingService?.name || requestedService || provider.user.serviceType,
      date: req.body.date,
      timeSlot: req.body.timeSlot,
      address: req.body.address,
      details: req.body.details,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("The provider already has a booking reserved for this date and time slot", 409);
    }
    throw err;
  }

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
    throw new AppError("Booking cannot be cancelled", 404);
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
    throw new AppError("Booking cannot be rescheduled", 404);
  }

  const slotConflict = await Booking.findOne({
    _id: { $ne: booking._id },
    provider: booking.provider,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    status: { $in: ["pending", "accepted", "in_progress"] },
  });

  if (slotConflict) {
    throw new AppError("The provider already has an appointment reserved for the requested date and time slot", 409);
  }

  booking.date = req.body.date;
  booking.timeSlot = req.body.timeSlot;

  try {
    await booking.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("The provider already has an appointment reserved for the requested date and time slot", 409);
    }
    throw err;
  }

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

  if (req.body.status === "completed") {
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        ...providerBookingFilter(req),
        status: "in_progress",
      },
      { $set: { status: "completed" } },
      { new: true },
    );

    if (!updatedBooking) {
      throw new AppError("Booking is not in progress or has already been completed", 400);
    }

    await ProviderProfile.findByIdAndUpdate(updatedBooking.provider, {
      $inc: { completedJobs: 1 },
    });

    await createNotification({
      recipient: updatedBooking.customer,
      type: "booking_status",
      title: "Booking status updated",
      message: `Your ${updatedBooking.service} booking is now completed.`,
      booking: updatedBooking._id,
    });

    return sendSuccess(res, { data: { booking: updatedBooking }, message: "Booking status updated" });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    ...providerBookingFilter(req),
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const allowedTransitions = {
    pending: ["accepted", "rejected"],
    accepted: ["in_progress"],
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
