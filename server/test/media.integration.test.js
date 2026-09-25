import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";
import { Readable } from "node:stream";
import http from "http";
import crypto from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/local_services_marketplace_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-thirty-two-characters";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret-that-is-long-enough";

const { default: app } = await import("../src/app.js");
const { cloudinary } = await import("../src/config/cloudinary.js");
const { signAccessToken } = await import("../src/utils/jwt.js");
const { User } = await import("../src/models/User.js");
const { ProviderProfile } = await import("../src/models/ProviderProfile.js");

let mongoServer;
let uploadNumber = 0;
let uploadMocked = false;

const pdfBuffer = Buffer.from("%PDF-1.7\nverification document");
const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function tokenFor(user) {
  return signAccessToken(user._id.toString());
}

function authenticated(requestBuilder, user) {
  return requestBuilder.set("Authorization", `Bearer ${tokenFor(user)}`);
}

async function createUser(role = "customer") {
  return User.create({
    name: `${role} ${crypto.randomUUID()}`,
    email: `${role}-${crypto.randomUUID()}@example.test`,
    phone: "9999999999",
    password: "SecurePassword123!",
    role,
    pincode: "560001",
    serviceType: role === "provider" ? "plumbing" : undefined,
    termsAcceptedAt: new Date(),
  });
}

async function createProvider() {
  const user = await createUser("provider");
  const profile = await ProviderProfile.create({
    user: user._id,
    isApproved: false,
    approvalStatus: "pending",
  });
  return { user, profile };
}

function mockCloudinaryUpload() {
  if (uploadMocked) return;
  uploadMocked = true;
  mock.method(cloudinary.uploader, "upload_stream", (options, callback) => {
    const isPdf = options.resource_type === "raw";
    const number = ++uploadNumber;
    return {
      end() {
        callback(null, {
          public_id: `fixit-local/verifications/document-${number}`,
          resource_type: isPdf ? "raw" : "image",
          format: isPdf ? "pdf" : "jpg",
          secure_url: `https://res.cloudinary.test/private/document-${number}`,
        });
      },
    };
  });
}

function mockPrivateDelivery({ statusCode = 200, body = pdfBuffer } = {}) {
  let signedUrl;
  mock.method(cloudinary.utils, "private_download_url", (publicId, format, options) => {
    signedUrl = { publicId, format, options };
    return "http://cloudinary.test/private-document";
  });
  mock.method(http, "get", (_url, callback) => {
    const storageResponse = Readable.from([body]);
    storageResponse.statusCode = statusCode;
    storageResponse.headers = {
      "content-type": "application/pdf",
      "content-length": String(body.length),
    };
    callback(storageResponse);
    return { on() { return this; } };
  });
  return () => signedUrl;
}

function mockCloudinaryDestroy(result = { result: "ok" }, error = null) {
  mock.method(cloudinary.uploader, "destroy", (_publicId, _options, callback) => {
    callback(error, result);
  });
}

async function uploadDocument(user, buffer = pdfBuffer, contentType = "application/pdf") {
  mockCloudinaryUpload();
  return authenticated(
    request(app)
      .post("/api/providers/me/verification-documents")
      .attach("document", buffer, { filename: "verification-document.pdf", contentType }),
    user,
  );
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.createIndexes();
  await ProviderProfile.createIndexes();
});

beforeEach(async () => {
  mock.restoreAll();
  uploadNumber = 0;
  uploadMocked = false;
  await Promise.all([ProviderProfile.deleteMany({}), User.deleteMany({})]);
});

after(async () => {
  mock.restoreAll();
  if (!mongoServer) return;
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("provider can upload a valid PDF without receiving a Cloudinary URL", async () => {
  const provider = await createProvider();
  const response = await uploadDocument(provider.user);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.verificationDocuments.length, 1);
  assert.equal(response.body.data.verificationDocuments[0].format, "pdf");
  assert.equal("documentUrl" in response.body.data, false);
  assert.equal("publicId" in response.body.data.verificationDocuments[0], false);
});

test("provider can upload a valid image", async () => {
  const provider = await createProvider();
  const response = await uploadDocument(provider.user, jpegBuffer, "image/jpeg");

  assert.equal(response.status, 200);
  assert.equal(response.body.data.verificationDocuments[0].format, "jpg");
  assert.equal(response.body.data.verificationDocuments[0].resourceType, "image");
});

test("invalid MIME types and magic bytes are rejected", async () => {
  const provider = await createProvider();

  const invalidMime = await uploadDocument(provider.user, Buffer.from("plain text"), "text/plain");
  assert.equal(invalidMime.status, 400);

  const invalidSignature = await uploadDocument(provider.user, Buffer.from("not an image"), "image/jpeg");
  assert.equal(invalidSignature.status, 400);
});

test("uploads larger than the Multer limit are rejected", async () => {
  const provider = await createProvider();
  const oversized = Buffer.concat([pdfBuffer, Buffer.alloc(5 * 1024 * 1024)]);
  const response = await uploadDocument(provider.user, oversized);

  assert.equal(response.status, 413);
});

test("the fifth-document limit is enforced", async () => {
  const provider = await createProvider();
  await ProviderProfile.findByIdAndUpdate(provider.profile._id, {
    verificationDocuments: Array.from({ length: 5 }, (_, index) => ({
      publicId: `existing-${index}`,
      resourceType: "raw",
      format: "pdf",
    })),
  });

  const response = await uploadDocument(provider.user);
  assert.equal(response.status, 400);
  assert.match(response.body.message, /maximum limit/i);
});

test("document access requires authentication and the provider role", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "own-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();
  const customer = await createUser("customer");

  const unauthenticated = await request(app).get("/api/providers/me/verification-documents/0");
  assert.equal(unauthenticated.status, 401);

  const customerResponse = await authenticated(
    request(app).get("/api/providers/me/verification-documents/0"),
    customer,
  );
  assert.equal(customerResponse.status, 403);
});

test("provider can access only their own document through signed private delivery", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "own-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();
  const otherProvider = await createProvider();

  const signedUrl = mockPrivateDelivery();
  const ownResponse = await authenticated(
    request(app).get("/api/providers/me/verification-documents/0"),
    provider.user,
  );
  assert.equal(ownResponse.status, 200);
  assert.equal(ownResponse.headers["content-type"], "application/pdf");
  assert.equal(ownResponse.text, pdfBuffer.toString());
  assert.equal(signedUrl().publicId, "own-document");
  assert.equal(signedUrl().options.type, "private");

  const otherResponse = await authenticated(
    request(app).get("/api/providers/me/verification-documents/0"),
    otherProvider.user,
  );
  assert.equal(otherResponse.status, 404);
});

test("admin can access a provider document and invalid indexes are rejected", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "admin-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();
  const admin = await createUser("admin");

  mockPrivateDelivery();
  const adminResponse = await authenticated(
    request(app).get(`/api/admin/providers/${provider.profile._id}/verification-documents/0`),
    admin,
  );
  assert.equal(adminResponse.status, 200);

  const invalid = await authenticated(
    request(app).get(`/api/admin/providers/${provider.profile._id}/verification-documents/not-an-index`),
    admin,
  );
  assert.equal(invalid.status, 400);

  const missing = await authenticated(
    request(app).get(`/api/admin/providers/${provider.profile._id}/verification-documents/5`),
    admin,
  );
  assert.equal(missing.status, 404);
});

test("missing Cloudinary resources return a safe not-found response", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "missing-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();

  mockPrivateDelivery({ statusCode: 404 });
  const response = await authenticated(
    request(app).get("/api/providers/me/verification-documents/0"),
    provider.user,
  );
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Unable to retrieve verification document from storage");
});

test("profile and admin payloads expose metadata but no raw Cloudinary URL", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{
    publicId: "private-document",
    resourceType: "raw",
    format: "pdf",
    originalFilename: "license.pdf",
  }];
  await provider.profile.save();
  const admin = await createUser("admin");

  const profileResponse = await authenticated(request(app).get("/api/providers/me/profile"), provider.user);
  assert.equal(profileResponse.status, 200);
  assert.equal(profileResponse.body.data.profile.verificationDocuments[0].originalFilename, "license.pdf");
  assert.equal(JSON.stringify(profileResponse.body).includes("private-document"), false);

  const adminResponse = await authenticated(request(app).get("/api/admin/providers/pending"), admin);
  assert.equal(adminResponse.status, 200);
  assert.equal(JSON.stringify(adminResponse.body).includes("private-document"), false);
  assert.equal(adminResponse.body.data.providers[0].verificationDocuments.length, 1);
});

test("provider deletion removes the database reference after Cloudinary deletion", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "delete-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();
  mockCloudinaryDestroy();

  const response = await authenticated(
    request(app).delete("/api/providers/me/verification-documents/0"),
    provider.user,
  );
  assert.equal(response.status, 200);
  assert.equal((await ProviderProfile.findById(provider.profile._id)).verificationDocuments.length, 0);
});

test("failed Cloudinary deletion preserves the database reference", async () => {
  const provider = await createProvider();
  provider.profile.verificationDocuments = [{ publicId: "keep-document", resourceType: "raw", format: "pdf" }];
  await provider.profile.save();
  mockCloudinaryDestroy({}, new Error("storage unavailable"));

  const response = await authenticated(
    request(app).delete("/api/providers/me/verification-documents/0"),
    provider.user,
  );
  assert.equal(response.status, 502);
  assert.equal((await ProviderProfile.findById(provider.profile._id)).verificationDocuments.length, 1);
});
