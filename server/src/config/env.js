import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function parseMongoDatabaseName(uri) {
  try {
    const normalized = uri.replace(/^mongodb\+srv:/, "https:").replace(/^mongodb:/, "http:");
    const url = new URL(normalized);
    const database = url.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
    return database || null;
  } catch {
    const match = uri.match(/@[^/?#]+\/([^/?#]+)/);
    return match?.[1] || null;
  }
}

function parseMongoHost(uri) {
  try {
    const normalized = uri.replace(/^mongodb\+srv:/, "https:").replace(/^mongodb:/, "http:");
    const url = new URL(normalized);
    return url.hostname || null;
  } catch {
    const match = uri.match(/@([^/?#]+)/);
    return match?.[1] || null;
  }
}

const mongoUri = process.env.MONGODB_URI.trim();
const mongoDatabase = parseMongoDatabaseName(mongoUri);

if (!mongoDatabase) {
  throw new Error(
    "MONGODB_URI must include an explicit database name (e.g. ...mongodb.net/local_services_marketplace)",
  );
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET.trim();
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET.trim();

if (jwtAccessSecret.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must be at least 32 characters");
}

if (jwtRefreshSecret.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
}

export function getMongoConnectionLabel() {
  const host = parseMongoHost(mongoUri) || "(unknown-host)";
  return `${host}/${mongoDatabase}`;
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri,
  mongoDatabase,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  cookieSecret: process.env.COOKIE_SECRET || null,
  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};
