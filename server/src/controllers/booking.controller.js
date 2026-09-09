import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { Booking } from "../models/Booking.js";

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create({
    ...req.body,
    customer: req.user.id,
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
  sendSuccess(res, { data: { booking }, message: "Booking rescheduled" });
});

function providerBookingFilter(req) {
  return {
    $or: [{ providerId: req.user.id }, { providerName: req.user.name }],
  };
}

export const getProviderBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find(providerBookingFilter(req))
    .populate("customer", "name email phone")
    .sort({ createdAt: -1 });

  sendSuccess(res, { data: { bookings } });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
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

  booking.status = req.body.status;
  await booking.save();

  sendSuccess(res, { data: { booking }, message: "Booking status updated" });
});
