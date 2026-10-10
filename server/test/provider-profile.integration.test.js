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

async function createProviderProfile(user, verificationDocuments = []) {
  return ProviderProfile.create({
    user: user._id,
    bio: "Existing provider bio",
    pricePerVisit: 500,
    yearsExperience: 8,
    serviceAreas: [{ city: "Pune", pincode: "411001" }],
    services: [{ name: "Pipe repair", description: "Leak repairs", price: 500 }],
    verificationDocuments,
    approvalStatus: "pending",
    isApproved: false,
  });
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.createIndexes();
  await ProviderProfile.createIndexes();
});

beforeEach(async () => {
  await Promise.all([ProviderProfile.deleteMany({}), User.deleteMany({})]);
});

after(async () => {
  if (!mongoServer) return;
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("provider profile PATCH preserves fields omitted from the request", async () => {
  const user = await createUser("provider");
  const profile = await createProviderProfile(user);

  const response = await authenticated(
    request(app).patch("/api/providers/me/profile"),
    user,
  ).send({ bio: "Updated provider bio" });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.profile.bio, "Updated provider bio");
  assert.deepEqual(response.body.data.profile.serviceAreas, [
    { city: "Pune", pincode: "411001" },
  ]);
  assert.equal(response.body.data.profile.services[0].name, "Pipe repair");
  assert.equal(response.body.data.profile.services[0].price, 500);
  assert.equal(response.body.data.profile.yearsExperience, 8);
  assert.equal(response.body.data.profile._id, profile._id.toString());
});

test("admin cannot approve a provider without a valid verification document", async () => {
  const admin = await createUser("admin");
  const providerUser = await createUser("provider");
  const profile = await createProviderProfile(providerUser);

  const response = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/approve`),
    admin,
  );

  assert.equal(response.status, 409);
  assert.match(response.body.message, /verification document/i);
  const unchangedProfile = await ProviderProfile.findById(profile._id);
  assert.equal(unchangedProfile.approvalStatus, "pending");
  assert.equal(unchangedProfile.isApproved, false);
});

test("admin can approve a provider with a valid submitted verification document", async () => {
  const admin = await createUser("admin");
  const providerUser = await createUser("provider");
  const profile = await createProviderProfile(providerUser, [
    {
      publicId: "fixit-local/verifications/provider-license",
      resourceType: "raw",
      format: "pdf",
      originalFilename: "license.pdf",
      uploadedAt: new Date(),
    },
  ]);

  const response = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/approve`),
    admin,
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.data.provider.approvalStatus, "approved");
  assert.equal(response.body.data.provider.isApproved, true);
  assert.equal(response.body.data.provider.verificationDocuments[0].publicId, undefined);
});

test("non-admin users cannot access pending providers or change approval", async () => {
  const customer = await createUser("customer");
  const providerUser = await createUser("provider");
  const profile = await createProviderProfile(providerUser, [
    { publicId: "fixit-local/verifications/document", resourceType: "raw", format: "pdf" },
  ]);

  const pendingResponse = await authenticated(
    request(app).get("/api/admin/providers/pending"),
    customer,
  );
  const approveResponse = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/approve`),
    customer,
  );
  const rejectResponse = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/reject`),
    customer,
  ).send({ reason: "Not authorized" });

  assert.equal(pendingResponse.status, 403);
  assert.equal(approveResponse.status, 403);
  assert.equal(rejectResponse.status, 403);
});

test("admin rejection persists the supplied reason and sanitizes the response", async () => {
  const admin = await createUser("admin");
  const providerUser = await createUser("provider");
  const profile = await createProviderProfile(providerUser, [
    {
      publicId: "fixit-local/verifications/provider-license",
      resourceType: "raw",
      format: "pdf",
      originalFilename: "license.pdf",
    },
  ]);

  const response = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/reject`),
    admin,
  ).send({ reason: "Please upload a clearer document." });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.provider.approvalStatus, "rejected");
  assert.equal(response.body.data.provider.approvalReason, "Please upload a clearer document.");
  assert.equal(response.body.data.provider.verificationDocuments[0].publicId, undefined);
  assert.equal(response.body.data.provider.verificationDocuments[0].originalFilename, "license.pdf");
});

test("admin rejection reasons cannot exceed the backend limit", async () => {
  const admin = await createUser("admin");
  const providerUser = await createUser("provider");
  const profile = await createProviderProfile(providerUser);

  const response = await authenticated(
    request(app).patch(`/api/admin/providers/${profile._id}/reject`),
    admin,
  ).send({ reason: "x".repeat(501) });

  assert.equal(response.status, 400);
  assert.equal((await ProviderProfile.findById(profile._id)).approvalStatus, "pending");
});
