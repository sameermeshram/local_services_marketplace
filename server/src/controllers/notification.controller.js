import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { Notification } from "../models/Notification.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user.id };
  if (req.query.unread === "true") filter.readAt = null;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).populate("booking", "providerName service status").sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ recipient: req.user.id, readAt: null }),
  ]);

  sendSuccess(res, { data: { notifications, unreadCount } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { readAt: new Date() },
    { new: true },
  );

  if (!notification) throw new AppError("Notification not found", 404);
  sendSuccess(res, { data: { notification }, message: "Notification marked as read" });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, readAt: null },
    { readAt: new Date() },
  );

  sendSuccess(res, { message: "Notifications marked as read" });
});
