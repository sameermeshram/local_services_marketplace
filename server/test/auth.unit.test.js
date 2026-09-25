import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-thirty-two-characters";

const { User } = await import("../src/models/User.js");

let mongoServer;

function createTestUser(overrides = {}) {
  return User.create({
    name: "Test User",
    email: `test-${crypto.randomUUID()}@example.test`,
    phone: "9999999999",
    password: "SecurePassword123!",
    role: "customer",
    pincode: "560001",
    termsAcceptedAt: new Date(),
    ...overrides,
  });
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.createIndexes();
});

beforeEach(async () => {
  await User.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Email verification token tests
test("generateVerificationToken creates a hex token and sets expiry to 24 hours", async () => {
  const user = await createTestUser();
  const beforeGeneration = Date.now();

  const rawToken = user.generateVerificationToken();

  // Token should be 64 hex characters (32 bytes)
  assert.ok(/^[a-f0-9]{64}$/.test(rawToken), "Token should be 64 hex characters");
  assert.ok(user.verificationToken, "verificationToken should be set");
  assert.ok(user.verificationExpires, "verificationExpires should be set");

  // Expiry should be approximately 24 hours from now
  const expectedExpiry = new Date(beforeGeneration + 24 * 60 * 60 * 1000);
  const tolerance = 1000; // 1 second tolerance
  assert.ok(
    Math.abs(user.verificationExpires.getTime() - expectedExpiry.getTime()) < tolerance,
    "Expiry should be ~24 hours from now"
  );
});

test("generateVerificationToken hashes the token with SHA-256 before storing", async () => {
  const user = await createTestUser();
  const rawToken = user.generateVerificationToken();

  const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.equal(user.verificationToken, expectedHash, "Token should be SHA-256 hashed before storage");
});

test("generateVerificationToken returns different tokens on each call", async () => {
  const user = await createTestUser();
  const token1 = user.generateVerificationToken();
  const token2 = user.generateVerificationToken();

  assert.notEqual(token1, token2, "Each call should generate a unique token");
});

test("verifyEmail sets isVerified to true and clears verification fields", async () => {
  const user = await createTestUser();
  user.generateVerificationToken();
  await user.save();

  user.verifyEmail();

  assert.equal(user.isVerified, true, "isVerified should be true");
  assert.equal(user.verificationToken, undefined, "verificationToken should be cleared");
  assert.equal(user.verificationExpires, undefined, "verificationExpires should be cleared");
});

test("verification token fields are not returned by default in queries", async () => {
  const user = await createTestUser();
  user.generateVerificationToken();
  await user.save();

  const foundUser = await User.findById(user._id);

  assert.equal(foundUser.verificationToken, undefined, "verificationToken should not be selected by default");
  assert.equal(foundUser.verificationExpires, undefined, "verificationExpires should not be selected by default");
});

test("verification token fields can be selected explicitly", async () => {
  const user = await createTestUser();
  user.generateVerificationToken();
  await user.save();

  const foundUser = await User.findById(user._id).select("+verificationToken +verificationExpires");

  assert.ok(foundUser.verificationToken, "verificationToken should be selectable");
  assert.ok(foundUser.verificationExpires, "verificationExpires should be selectable");
});

// Password reset token tests
test("generatePasswordResetToken creates a hex token and sets expiry to 1 hour", async () => {
  const user = await createTestUser();
  const beforeGeneration = Date.now();

  const rawToken = user.generatePasswordResetToken();

  // Token should be 64 hex characters (32 bytes)
  assert.ok(/^[a-f0-9]{64}$/.test(rawToken), "Token should be 64 hex characters");
  assert.ok(user.passwordResetToken, "passwordResetToken should be set");
  assert.ok(user.passwordResetExpires, "passwordResetExpires should be set");

  // Expiry should be approximately 1 hour from now
  const expectedExpiry = new Date(beforeGeneration + 60 * 60 * 1000);
  const tolerance = 1000; // 1 second tolerance
  assert.ok(
    Math.abs(user.passwordResetExpires.getTime() - expectedExpiry.getTime()) < tolerance,
    "Expiry should be ~1 hour from now"
  );
});

test("generatePasswordResetToken hashes the token with SHA-256 before storing", async () => {
  const user = await createTestUser();
  const rawToken = user.generatePasswordResetToken();

  const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.equal(user.passwordResetToken, expectedHash, "Token should be SHA-256 hashed before storage");
});

test("generatePasswordResetToken returns different tokens on each call", async () => {
  const user = await createTestUser();
  const token1 = user.generatePasswordResetToken();
  const token2 = user.generatePasswordResetToken();

  assert.notEqual(token1, token2, "Each call should generate a unique token");
});

test("resetPassword sets new password and clears reset fields", async () => {
  const user = await createTestUser();
  user.generatePasswordResetToken();
  await user.save();

  const newPassword = "NewSecurePassword456!";
  user.resetPassword(newPassword);

  assert.equal(user.password, newPassword, "Password should be updated");
  assert.equal(user.passwordResetToken, undefined, "passwordResetToken should be cleared");
  assert.equal(user.passwordResetExpires, undefined, "passwordResetExpires should be cleared");
  assert.ok(user.passwordChangedAt, "passwordChangedAt should be set");
});

test("resetPassword allows pre-save hook to hash password exactly once", async () => {
  const user = await createTestUser();
  const originalPassword = user.password;

  user.resetPassword("NewSecurePassword456!");
  await user.save();

  // Password should be hashed (not plaintext)
  assert.notEqual(user.password, "NewSecurePassword456!", "Password should be hashed");
  assert.notEqual(user.password, originalPassword, "Password should be different from original");

  // Verify the hashed password works for comparison
  const isMatch = await user.comparePassword("NewSecurePassword456!");
  assert.ok(isMatch, "comparePassword should work with the new hashed password");
});

test("passwordChangedAt is set when password is changed", async () => {
  const user = await createTestUser();
  const beforeChange = Date.now();

  user.resetPassword("NewSecurePassword456!");

  assert.ok(user.passwordChangedAt, "passwordChangedAt should be set");
  const changedAt = user.passwordChangedAt.getTime();
  assert.ok(
    Math.abs(changedAt - beforeChange) < 1000,
    "passwordChangedAt should be set to current time"
  );
});

test("password reset token fields are not returned by default in queries", async () => {
  const user = await createTestUser();
  user.generatePasswordResetToken();
  await user.save();

  const foundUser = await User.findById(user._id);

  assert.equal(foundUser.passwordResetToken, undefined, "passwordResetToken should not be selected by default");
  assert.equal(foundUser.passwordResetExpires, undefined, "passwordResetExpires should not be selected by default");
});

test("password reset token fields can be selected explicitly", async () => {
  const user = await createTestUser();
  user.generatePasswordResetToken();
  await user.save();

  const foundUser = await User.findById(user._id).select("+passwordResetToken +passwordResetExpires");

  assert.ok(foundUser.passwordResetToken, "passwordResetToken should be selectable");
  assert.ok(foundUser.passwordResetExpires, "passwordResetExpires should be selectable");
});

// Failed login tracking tests
test("incrementFailedLogins increases failedLoginAttempts counter", async () => {
  const user = await createTestUser();

  assert.equal(user.failedLoginAttempts, 0, "Initial failedLoginAttempts should be 0");

  user.incrementFailedLogins();
  assert.equal(user.failedLoginAttempts, 1, "failedLoginAttempts should be 1 after first increment");

  user.incrementFailedLogins();
  assert.equal(user.failedLoginAttempts, 2, "failedLoginAttempts should be 2 after second increment");
});

test("incrementFailedLogins persists across save operations", async () => {
  const user = await createTestUser();

  user.incrementFailedLogins();
  user.incrementFailedLogins();
  user.incrementFailedLogins();
  await user.save();

  const foundUser = await User.findById(user._id);
  assert.equal(foundUser.failedLoginAttempts, 3, "failedLoginAttempts should persist as 3");
});

test("resetFailedLogins sets failedLoginAttempts to 0 and clears accountLockedUntil", async () => {
  const user = await createTestUser();
  user.failedLoginAttempts = 5;
  user.accountLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  user.resetFailedLogins();

  assert.equal(user.failedLoginAttempts, 0, "failedLoginAttempts should be reset to 0");
  assert.equal(user.accountLockedUntil, undefined, "accountLockedUntil should be cleared");
});

test("resetFailedLogins persists across save operations", async () => {
  const user = await createTestUser();
  user.failedLoginAttempts = 5;
  user.accountLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  user.resetFailedLogins();
  await user.save();

  const foundUser = await User.findById(user._id);
  assert.equal(foundUser.failedLoginAttempts, 0, "failedLoginAttempts should persist as 0");
  assert.equal(foundUser.accountLockedUntil, undefined, "accountLockedUntil should be cleared");
});

// Account lockout detection tests
test("isAccountLocked returns false when accountLockedUntil is not set", async () => {
  const user = await createTestUser();

  assert.equal(user.isAccountLocked(), false, "Account should not be locked when accountLockedUntil is not set");
});

test("isAccountLocked returns false when accountLockedUntil is in the past", async () => {
  const user = await createTestUser();
  user.accountLockedUntil = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  assert.equal(user.isAccountLocked(), false, "Account should not be locked when lockout period has expired");
});

test("isAccountLocked returns true when accountLockedUntil is in the future", async () => {
  const user = await createTestUser();
  user.accountLockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  assert.equal(user.isAccountLocked(), true, "Account should be locked when lockout period is active");
});

test("isAccountLocked returns false when accountLockedUntil equals current time", async () => {
  const user = await createTestUser();
  user.accountLockedUntil = new Date();

  assert.equal(user.isAccountLocked(), false, "Account should not be locked when lockout period exactly equals now");
});

// Integration tests - existing functionality preserved
test("existing password hashing pre-save hook still works", async () => {
  const user = await createTestUser({ password: "PlaintextPassword123!" });

  // Password should be hashed
  assert.notEqual(user.password, "PlaintextPassword123!", "Password should be hashed on save");

  // comparePassword should work
  const isMatch = await user.comparePassword("PlaintextPassword123!");
  assert.ok(isMatch, "comparePassword should verify correct password");

  const isWrongMatch = await user.comparePassword("WrongPassword!");
  assert.ok(!isWrongMatch, "comparePassword should reject wrong password");
});

test("existing refreshToken methods still work", async () => {
  const user = await createTestUser();
  const testToken = "test-refresh-token-12345";

  user.setRefreshToken(testToken);
  const expectedHash = crypto.createHash("sha256").update(testToken).digest("hex");

  assert.equal(user.refreshTokenHash, expectedHash, "setRefreshToken should hash the token");
  assert.ok(user.compareRefreshToken(testToken), "compareRefreshToken should verify the token");

  user.clearRefreshToken();
  assert.equal(user.refreshTokenHash, null, "clearRefreshToken should set hash to null");
  assert.ok(!user.compareRefreshToken(testToken), "compareRefreshToken should return false after clear");
});

test("email uniqueness constraint exists", async () => {
  await createTestUser({ email: "unique@example.test" });

  try {
    await createTestUser({ email: "unique@example.test" });
    assert.fail("Should have thrown duplicate key error");
  } catch (error) {
    assert.ok(error.code === 11000 || error.name === "MongoServerError", "Should throw duplicate key error");
  }
});

// Edge cases and invalid token handling
test("verifyEmail can be called on unverified user without token", async () => {
  const user = await createTestUser();

  // Should not throw even if no token was generated
  assert.doesNotThrow(() => user.verifyEmail());
  assert.equal(user.isVerified, true);
});

test("resetPassword can be called without prior reset token", async () => {
  const user = await createTestUser();

  // Should not throw even if no reset token was generated
  assert.doesNotThrow(() => user.resetPassword("NewPassword123!"));
  assert.equal(user.password, "NewPassword123!");
});

test("failedLoginAttempts defaults to 0 for new users", async () => {
  const user = await createTestUser();

  assert.equal(user.failedLoginAttempts, 0, "New users should have failedLoginAttempts = 0");
});

test("accountLockedUntil and lastLoginAt are undefined by default", async () => {
  const user = await createTestUser();

  assert.equal(user.accountLockedUntil, undefined, "accountLockedUntil should be undefined by default");
  assert.equal(user.lastLoginAt, undefined, "lastLoginAt should be undefined by default");
});

test("passwordChangedAt is undefined by default", async () => {
  const user = await createTestUser();

  assert.equal(user.passwordChangedAt, undefined, "passwordChangedAt should be undefined by default");
});

test("verification token expiry is exactly 24 hours", async () => {
  const user = await createTestUser();
  const before = Date.now();

  user.generateVerificationToken();

  const expectedMin = new Date(before + 24 * 60 * 60 * 1000 - 1000);
  const expectedMax = new Date(before + 24 * 60 * 60 * 1000 + 1000);

  assert.ok(
    user.verificationExpires >= expectedMin && user.verificationExpires <= expectedMax,
    "Verification token should expire in exactly 24 hours"
  );
});

test("password reset token expiry is exactly 1 hour", async () => {
  const user = await createTestUser();
  const before = Date.now();

  user.generatePasswordResetToken();

  const expectedMin = new Date(before + 60 * 60 * 1000 - 1000);
  const expectedMax = new Date(before + 60 * 60 * 1000 + 1000);

  assert.ok(
    user.passwordResetExpires >= expectedMin && user.passwordResetExpires <= expectedMax,
    "Password reset token should expire in exactly 1 hour"
  );
});

// Token security tests
test("raw tokens are not stored in database - verification", async () => {
  const user = await createTestUser();
  const rawToken = user.generateVerificationToken();
  await user.save();

  const foundUser = await User.findById(user._id).select("+verificationToken");

  assert.notEqual(foundUser.verificationToken, rawToken, "Raw token should not match stored token");
  assert.ok(foundUser.verificationToken.length === 64, "Stored token should be 64 char hex (SHA-256)");
});

test("raw tokens are not stored in database - password reset", async () => {
  const user = await createTestUser();
  const rawToken = user.generatePasswordResetToken();
  await user.save();

  const foundUser = await User.findById(user._id).select("+passwordResetToken");

  assert.notEqual(foundUser.passwordResetToken, rawToken, "Raw token should not match stored token");
  assert.ok(foundUser.passwordResetToken.length === 64, "Stored token should be 64 char hex (SHA-256)");
});

test("tokens have sufficient entropy (32 bytes = 256 bits)", async () => {
  const user = await createTestUser();

  const verificationToken = user.generateVerificationToken();
  user.passwordResetToken = undefined; // Clear to generate new one
  const resetToken = user.generatePasswordResetToken();

  // 32 bytes = 64 hex characters = 256 bits of entropy
  assert.equal(verificationToken.length, 64, "Verification token should be 64 hex chars (256 bits)");
  assert.equal(resetToken.length, 64, "Reset token should be 64 hex chars (256 bits)");
});
