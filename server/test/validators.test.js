import assert from "node:assert/strict";
import { test } from "node:test";
import { body } from "express-validator";

// Test the date validation logic
function isFutureDate(value) {
  const bookingDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(bookingDate.getTime())) {
    throw new Error("Invalid date format");
  }

  if (bookingDate < today) {
    throw new Error("Booking date cannot be in the past");
  }

  return true;
}

test("isFutureDate rejects past dates", () => {
  const pastDate = "2020-01-01";
  assert.throws(() => isFutureDate(pastDate), /cannot be in the past/);
});

test("isFutureDate accepts future dates", () => {
  const futureDate = "2027-12-31";
  assert.doesNotThrow(() => isFutureDate(futureDate));
});

test("isFutureDate accepts today's date", () => {
  const today = new Date().toISOString().split('T')[0];
  assert.doesNotThrow(() => isFutureDate(today));
});

test("isFutureDate rejects invalid date format", () => {
  const invalidDate = "not-a-date";
  assert.throws(() => isFutureDate(invalidDate), /Invalid date format/);
});
