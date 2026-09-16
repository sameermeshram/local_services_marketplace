import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Booking } from "../models/Booking.js";

async function syncBookingIndexes() {
  try {
    await connectDB();
    await Booking.createIndexes();

    const indexes = await Booking.collection.indexes();
    const activeSlotIndex = indexes.find((index) => index.name === "unique_active_provider_slot");
    if (!activeSlotIndex?.unique || !activeSlotIndex.partialFilterExpression) {
      throw new Error("The unique active provider-slot booking index was not created");
    }

    console.log("Booking indexes verified");
  } finally {
    await mongoose.disconnect();
  }
}

syncBookingIndexes().catch((error) => {
  console.error("Booking index synchronization failed:", error);
  process.exitCode = 1;
});
