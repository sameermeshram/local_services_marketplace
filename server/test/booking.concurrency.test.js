import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

// These values are set before importing application modules. The test connects
// directly to an ephemeral MongoDB instance and never uses the Atlas URI.
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-thirty-two-characters";

const { default: app } = await import("../src/app.js");
const { signAccessToken } = await import("../src/utils/jwt.js");
const { User } = await import("../src/models/User.js");
const { ProviderProfile } = await import("../src/models/ProviderProfile.js");
const { Booking } = await import("../src/models/Booking.js");
const { Review } = await import("../src/models/Review.js");
const { Notification } = await import("../src/models/Notification.js");

let mongoServer;

function tokenFor(user) {
  return signAccessToken(user._id.toString());
}

function authenticated(agent, user) {
  return agent.set("Authorization", `Bearer ${tokenFor(user)}`);
}

async function createUser({ role = "customer", name = "Test User", suffix = crypto.randomUUID() } = {}) {
  return User.create({
    name,
    email: `${role}-${suffix}@example.test`,
    phone: "9999999999",
    password: "secure-test-password",
    role,
    pincode: "560001",
    serviceType: role === "provider" ? "plumbing" : undefined,
    termsAcceptedAt: new Date(),
  });
}

async function createProvider() {
  const user = await createUser({ role: "provider", name: "Provider" });
  const profile = await ProviderProfile.create({
    user: user._id,
    isApproved: true,
    approvalStatus: "approved",
    isAvailable: true,
    services: [{ name: "Plumbing", price: 500 }],
  });
  return { user, profile };
}

function bookingPayload(providerId, overrides = {}) {
  return {
    providerId: providerId.toString(),
    service: "Plumbing",
    date: "2026-10-01",
    timeSlot: "morning",
    address: "1 Test Street",
    details: "Fix the kitchen tap",
    ...overrides,
  };
}

async function createBooking({ customer, provider, status = "pending", ...overrides }) {
  return Booking.create({
    customer: customer._id,
    provider: provider.profile._id,
    providerName: provider.user.name,
    service: "Plumbing",
    date: "2026-10-01",
    timeSlot: "morning",
    address: "1 Test Street",
    details: "Fix the kitchen tap",
    status,
    ...overrides,
  });
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Booking.createIndexes();
  await Review.createIndexes();
});

beforeEach(async () => {
  await Promise.all([
    Notification.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    ProviderProfile.deleteMany({}),
    User.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("the active-slot index has the required unique partial definition", async () => {
  const indexes = await Booking.collection.indexes();
  const index = indexes.find((entry) => entry.name === "unique_active_provider_slot");
  assert.equal(index.unique, true);
  assert.deepEqual(index.key, { provider: 1, date: 1, timeSlot: 1 });
  assert.deepEqual(index.partialFilterExpression, {
    status: { $in: ["pending", "accepted", "in_progress"] },
  });
});

test("simultaneous slot bookings yield one creation and duplicate-key conflicts", async () => {
  const provider = await createProvider();
  const customers = await Promise.all(Array.from({ length: 10 }, () => createUser()));
  const responses = await Promise.all(
    customers.map((customer) =>
      authenticated(request(app).post("/api/bookings"), customer).send(bookingPayload(provider.profile._id)),
    ),
  );

  assert.equal(responses.filter((response) => response.status === 201).length, 1);
  assert.equal(responses.filter((response) => response.status === 409).length, 9);
  assert.equal(
    await Booking.countDocuments({
      provider: provider.profile._id,
      date: "2026-10-01",
      timeSlot: "morning",
      status: { $in: ["pending", "accepted", "in_progress"] },
    }),
    1,
  );
});

test("only customers can create bookings", async () => {
  const provider = await createProvider();
  const admin = await createUser({ role: "admin" });
  const response = await authenticated(request(app).post("/api/bookings"), admin).send(
    bookingPayload(provider.profile._id),
  );

  assert.equal(response.status, 403);
  assert.equal(await Booking.countDocuments(), 0);
});

test("competing provider decisions have one winner, while completion is idempotent", async () => {
  const provider = await createProvider();
  const customer = await createUser();
  const booking = await createBooking({ customer, provider });

  const [accept, reject] = await Promise.all([
    authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "accepted" }),
    authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "rejected" }),
  ]);
  assert.equal([accept.status, reject.status].filter((status) => status === 200).length, 1);
  assert.equal([accept.status, reject.status].filter((status) => status === 409).length, 1);

  const decided = await Booking.findById(booking._id);
  let expectedStatusNotifications = 2;
  if (decided.status === "accepted") {
    const [startA, startB] = await Promise.all([
      authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "in_progress" }),
      authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "in_progress" }),
    ]);
    assert.equal([startA.status, startB.status].filter((status) => status === 200).length, 1);
    expectedStatusNotifications = 3;
  } else {
    await Booking.findByIdAndUpdate(booking._id, { status: "in_progress" });
  }

  const [completeA, completeB] = await Promise.all([
    authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "completed" }),
    authenticated(request(app).patch(`/api/bookings/${booking._id}/status`), provider.user).send({ status: "completed" }),
  ]);
  assert.equal(completeA.status, 200);
  assert.equal(completeB.status, 200);
  assert.equal((await Booking.findById(booking._id)).status, "completed");
  const providerResponse = await request(app).get(`/api/providers/${provider.profile._id}`);
  assert.equal(providerResponse.status, 200);
  assert.equal(providerResponse.body.data.provider.completedJobs, 1);
  assert.equal(
    await Notification.countDocuments({ booking: booking._id, type: "booking_status" }),
    expectedStatusNotifications,
  );
});

test("customer cancellation and rescheduling remain ownership- and state-conditional", async () => {
  const provider = await createProvider();
  const customer = await createUser();
  const otherCustomer = await createUser();
  const booking = await createBooking({ customer, provider });

  const unauthorized = await authenticated(
    request(app).patch(`/api/bookings/${booking._id}/reschedule`),
    otherCustomer,
  ).send({ date: "2026-10-02", timeSlot: "afternoon" });
  assert.equal(unauthorized.status, 409);

  const [reschedule, cancel] = await Promise.all([
    authenticated(request(app).patch(`/api/bookings/${booking._id}/reschedule`), customer).send({
      date: "2026-10-02",
      timeSlot: "afternoon",
    }),
    authenticated(request(app).patch(`/api/bookings/${booking._id}/cancel`), customer),
  ]);
  assert.ok([200, 409].includes(reschedule.status));
  assert.equal(cancel.status, 200);
  assert.equal((await Booking.findById(booking._id)).status, "cancelled");
});

test("cancel, reschedule, and start races only apply valid conditional mutations", async () => {
  const provider = await createProvider();
  const customer = await createUser();
  const cancelRaceBooking = await createBooking({ customer, provider });

  const [cancel, accept] = await Promise.all([
    authenticated(request(app).patch(`/api/bookings/${cancelRaceBooking._id}/cancel`), customer),
    authenticated(request(app).patch(`/api/bookings/${cancelRaceBooking._id}/status`), provider.user).send({ status: "accepted" }),
  ]);
  assert.equal(cancel.status, 200);
  assert.ok([200, 409].includes(accept.status));
  assert.equal((await Booking.findById(cancelRaceBooking._id)).status, "cancelled");

  const rescheduleRaceBooking = await createBooking({
    customer,
    provider,
    date: "2026-10-03",
    timeSlot: "evening",
    status: "accepted",
  });
  const [reschedule, start] = await Promise.all([
    authenticated(request(app).patch(`/api/bookings/${rescheduleRaceBooking._id}/reschedule`), customer).send({
      date: "2026-10-04",
      timeSlot: "morning",
    }),
    authenticated(request(app).patch(`/api/bookings/${rescheduleRaceBooking._id}/status`), provider.user).send({ status: "in_progress" }),
  ]);
  assert.ok([200, 409].includes(reschedule.status));
  assert.ok([200, 409].includes(start.status));
  const finalBooking = await Booking.findById(rescheduleRaceBooking._id);
  assert.ok(["accepted", "in_progress"].includes(finalBooking.status));
});

test("concurrent reviews use atomic provider aggregate updates", async () => {
  const provider = await createProvider();
  const customer = await createUser();
  const firstBooking = await createBooking({ customer, provider, status: "completed" });
  const secondBooking = await createBooking({
    customer,
    provider,
    status: "completed",
    date: "2026-10-02",
    timeSlot: "afternoon",
  });

  const [first, second, duplicate] = await Promise.all([
    authenticated(request(app).post(`/api/bookings/${firstBooking._id}/reviews`), customer).send({ rating: 5 }),
    authenticated(request(app).post(`/api/bookings/${secondBooking._id}/reviews`), customer).send({ rating: 1 }),
    authenticated(request(app).post(`/api/bookings/${firstBooking._id}/reviews`), customer).send({ rating: 5 }),
  ]);

  assert.equal([first.status, second.status, duplicate.status].filter((status) => status === 201).length, 2);
  assert.equal([first.status, second.status, duplicate.status].filter((status) => status === 409).length, 1);
  const profile = await ProviderProfile.findById(provider.profile._id);
  assert.equal(profile.reviewCount, 2);
  assert.equal(profile.ratingAverage, 3);
  assert.equal(profile.ratingTotal, undefined);
  const storedProfile = await ProviderProfile.findById(provider.profile._id).select("+ratingTotal");
  assert.equal(storedProfile.ratingTotal, 6);
});
