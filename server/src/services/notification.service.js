import { Notification } from "../models/Notification.js";
import { logger } from "../utils/logger.js";

export async function createNotification(payload) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    logger.error("Failed to create notification:", error.message);
    return null;
  }
}
