import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/local_services_marketplace_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-thirty-two-characters";

const { default: app } = await import("../src/app.js");
const { signAccessToken } = await import("../src/utils/jwt.js");
const { User } = await import("../src/models/User.js");
const { ProviderProfile } = await import("../src/models/ProviderProfile.js");
const { Booking } = await import("../src/models/Booking.js");

let mongoServer;

function authenticated(requestBuilder, user) {
  return requestBuilder.set(
    "Authorization",
    `Bearer ${signAccessToken(user._id.toString())}`,
  );
}

async function createUser(role) {
  const suffix = crypto.randomUUID();
  return User.create({
    name: `${role} user`,
    email: `${role}-${suffix}@example.test`,
    phone: "9999999999",
    password: "SecurePassword123!",
    role,
    pincode: "411001",
    serviceType: role === "provider" ? "plumbing" : undefined,
    termsAcceptedAt: new Date(),
  });
}

async function createBooking(customer, provider, index) {
  return Booking.create({
    customer: customer._id,
    provider: provider._id,
    providerName: "Test Provider",
    service: "Pipe repair",
    date: "2026-10-0" + (index + 1),
    timeSlot: ["morning", "afternoon", "evening"][index % 3],
    address: "Pune",
    details: `Booking ${index}`,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)),
  });
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([User.createIndexes(), ProviderProfile.createIndexes(), Booking.createIndexes()]);
});

beforeEach(async () => {
  await Promise.all([Booking.deleteMany({}), ProviderProfile.deleteMany({}), User.deleteMany({})]);
});

after(async () => {
  if (!mongoServer) return;
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("customer bookings support pagination and retain the unpaginated response shape", async () => {
  const customer = await createUser("customer");
  const providerUser = await createUser("provider");
  const provider = await ProviderProfile.create({ user: providerUser._id });
  await Promise.all([0, 1, 2].map((index) => createBooking(customer, provider, index)));

  const paged = await authenticated(request(app).get("/api/bookings/me?page=2&limit=1"), customer);
  assert.equal(paged.status, 200);
  assert.equal(paged.body.data.bookings.length, 1);
  assert.equal(paged.body.data.pagination.page, 2);
  assert.equal(paged.body.data.pagination.limit, 1);
  assert.equal(paged.body.data.pagination.total, 3);
  assert.equal(paged.body.data.pagination.pages, 3);

  const legacy = await authenticated(request(app).get("/api/bookings/me"), customer);
  assert.equal(legacy.status, 200);
  assert.equal(legacy.body.data.bookings.length, 3);
  assert.equal(legacy.body.data.pagination.limit, null);
});

test("provider bookings paginate only bookings belonging to that provider", async () => {
  const customer = await createUser("customer");
  const providerUser = await createUser("provider");
  const otherProviderUser = await createUser("provider");
  const provider = await ProviderProfile.create({ user: providerUser._id });
  const otherProvider = await ProviderProfile.create({ user: otherProviderUser._id });
  await Promise.all([
    createBooking(customer, provider, 0),
    createBooking(customer, provider, 1),
    createBooking(customer, otherProvider, 2),
  ]);

  const response = await authenticated(
    request(app).get("/api/bookings/provider?page=1&limit=1"),
    providerUser,
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.data.bookings.length, 1);
  assert.equal(response.body.data.bookings[0].customer.name, "customer user");
  assert.equal(response.body.data.pagination.total, 2);
  assert.equal(response.body.data.pagination.pages, 2);
});

test("booking pagination rejects invalid page and limit values", async () => {
  const customer = await createUser("customer");
  for (const query of ["page=0", "page=1.5", "limit=51", "limit=0"]) {
    const response = await authenticated(request(app).get(`/api/bookings/me?${query}`), customer);
    assert.equal(response.status, 400, query);
  }
});
