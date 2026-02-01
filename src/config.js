const path = require("path");

// Load .env for local dev (PaaS sets env vars directly)
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  require("dotenv").config({ path: path.join(process.cwd(), ".env") });
} catch {
  // ignore
}

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

function must(name) {
  const v = process.env[name];
  if (v && String(v).trim()) return String(v).trim();
  if (isProd) throw new Error(`Missing required env var: ${name}`);
  return "";
}

const config = {
  NODE_ENV,
  isProd,

  PORT: Number(process.env.PORT || 3000),

  // MongoDB (Atlas in prod, local docker for dev)
  // In dev: if missing/unavailable, server can fall back to an in-memory MongoDB.
  MONGODB_URI: (process.env.MONGODB_URI || "").trim(),

  JWT_ACCESS_SECRET: must("JWT_ACCESS_SECRET") || "dev_access_secret_change_me",
  JWT_REFRESH_SECRET: must("JWT_REFRESH_SECRET") || "dev_refresh_secret_change_me",
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 30 * 24 * 60 * 60,

  APP_ORIGIN: (process.env.APP_ORIGIN || "").trim() || null,

  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "admin@onlyclass.local").trim().toLowerCase(),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || "").trim() || (isProd ? "" : "OnlyClass123!"),

  SEED_DEMO: String(process.env.SEED_DEMO || (!isProd ? "true" : "false")).toLowerCase() === "true"
};

if (config.isProd) {
  if (!config.MONGODB_URI) throw new Error("Missing required env var: MONGODB_URI");
  if (!config.ADMIN_PASSWORD) throw new Error("Missing required env var: ADMIN_PASSWORD");
}

module.exports = { config };

