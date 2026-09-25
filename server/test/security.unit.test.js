import assert from "node:assert/strict";
import { test } from "node:test";
import app from "../src/app.js";

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("escapeRegex neutralizes regex metacharacters", () => {
  const maliciousInput = "(a+)+$";
  const escaped = escapeRegex(maliciousInput);
  assert.equal(escaped, "\\(a\\+\\)\\+\\$");

  // Verify that building a RegExp from escaped string matches literal string only
  const regex = new RegExp(escaped, "i");
  assert.ok(regex.test("(a+)+$"));
  assert.equal(regex.test("aaaaa"), false);
});

test("escapeRegex preserves normal city names", () => {
  const cityName = "New York";
  const escaped = escapeRegex(cityName);
  assert.equal(escaped, "New York");

  const regex = new RegExp(escaped, "i");
  assert.ok(regex.test("New York"));
  assert.ok(regex.test("new york"));
});

test("Express app trust proxy behavior", () => {
  assert.ok(app, "Express app should be exported");
  // Default is boolean false in development environment
  assert.equal(typeof app.get("trust proxy"), "boolean");
  assert.equal(app.get("trust proxy"), false);
});

test("Document index parameter validation logic", () => {
  const isValidIndex = (param, length) => {
    const index = Number.parseInt(param, 10);
    return !Number.isNaN(index) && index >= 0 && index < length;
  };

  assert.equal(isValidIndex("0", 3), true);
  assert.equal(isValidIndex("2", 3), true);
  assert.equal(isValidIndex("3", 3), false);
  assert.equal(isValidIndex("-1", 3), false);
  assert.equal(isValidIndex("invalid", 3), false);
});
