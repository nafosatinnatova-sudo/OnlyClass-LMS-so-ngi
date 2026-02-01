const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { sanitizeUser } = require("../utils/sanitize");
const { sha256 } = require("../utils/crypto");
const { createAccessToken, createRefreshToken, verifyRefreshToken } = require("../auth/tokens");
const { asyncHandler } = require("../middleware/asyncHandler");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cookieOptions({ config, maxAgeMs, path = "/" }) {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    maxAge: maxAgeMs,
    path
  };
}

function setAuthCookies({ res, config, user }) {
  const accessToken = createAccessToken({ user, config });
  const { token: refreshToken, tokenHash } = createRefreshToken({ user, config });

  res.cookie("oc_at", accessToken, cookieOptions({ config, maxAgeMs: config.accessTtlSeconds * 1000, path: "/" }));
  res.cookie("oc_rt", refreshToken, cookieOptions({ config, maxAgeMs: config.refreshTtlSeconds * 1000, path: "/api/auth" }));

  return { refreshTokenHash: tokenHash };
}

function clearAuthCookies({ res, config }) {
  res.clearCookie("oc_at", cookieOptions({ config, maxAgeMs: 0, path: "/" }));
  res.clearCookie("oc_rt", cookieOptions({ config, maxAgeMs: 0, path: "/api/auth" }));
}

function makeAuthRoutes({ config }) {
  const router = express.Router();

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const fullName = String(req.body?.fullName || "").trim();
      const ageRaw = req.body?.age;
      const age = ageRaw === "" || ageRaw === null || ageRaw === undefined ? null : Number(ageRaw);
      const email = normalizeEmail(req.body?.email);
      const phone = String(req.body?.phone || "").trim() || null;
      const password = String(req.body?.password || "");

      if (fullName.length < 3) return res.status(400).json({ error: "Full name is required" });
      if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email is required" });
      if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      if (age !== null && (!Number.isFinite(age) || age < 5 || age > 120)) return res.status(400).json({ error: "Valid age is required" });

      const exists = await User.findOne({ email }).lean();
      if (exists) return res.status(409).json({ error: "Email already registered" });

      const user = await User.create({
        fullName,
        age,
        email,
        phone,
        role: "student",
        blocked: false,
        passwordHash: await bcrypt.hash(password, 10),
        stats: { videosWatched: 0, testsAvg: 0, guidesDownloaded: 0, ratingPlace: null }
      });

      const { refreshTokenHash } = setAuthCookies({ res, config, user });
      user.refreshTokenHash = refreshTokenHash;
      await user.save();

      return res.json({ user: sanitizeUser(user) });
    })
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      if (user.blocked) return res.status(403).json({ error: "User is blocked" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const { refreshTokenHash } = setAuthCookies({ res, config, user });
      user.refreshTokenHash = refreshTokenHash;
      await user.save();

      return res.json({ user: sanitizeUser(user) });
    })
  );

  router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
      const token = req.cookies?.oc_rt ? String(req.cookies.oc_rt) : null;
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      let payload;
      try {
        payload = verifyRefreshToken({ token, config });
      } catch {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (user.blocked) return res.status(403).json({ error: "User is blocked" });
      if (Number(payload.tv) !== Number(user.tokenVersion)) return res.status(401).json({ error: "Unauthorized" });

      const incomingHash = sha256(token);
      if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) return res.status(401).json({ error: "Unauthorized" });

      const { refreshTokenHash } = setAuthCookies({ res, config, user });
      user.refreshTokenHash = refreshTokenHash;
      await user.save();

      return res.json({ ok: true });
    })
  );

  router.post(
    "/logout",
    asyncHandler(async (req, res) => {
      // Best-effort revoke refresh token
      const token = req.cookies?.oc_rt ? String(req.cookies.oc_rt) : null;
      if (token) {
        try {
          const payload = verifyRefreshToken({ token, config });
          const user = await User.findById(payload.sub);
          if (user) {
            user.refreshTokenHash = null;
            user.tokenVersion = Number(user.tokenVersion || 0) + 1;
            await user.save();
          }
        } catch {
          // ignore
        }
      }
      clearAuthCookies({ res, config });
      return res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { makeAuthRoutes };

