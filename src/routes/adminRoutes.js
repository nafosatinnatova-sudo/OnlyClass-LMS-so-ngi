const express = require("express");
const User = require("../models/User");
const { sanitizeUser } = require("../utils/sanitize");
const { asyncHandler } = require("../middleware/asyncHandler");

function makeAdminRoutes({ config, authRequired, requireRole }) {
  const router = express.Router();

  router.get(
    "/users",
    authRequired(config),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const users = await User.find({}).sort({ createdAt: -1 });
      return res.json({ users: users.map(sanitizeUser) });
    })
  );

  router.post(
    "/users/:id/role",
    authRequired(config),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const role = String(req.body?.role || "").toLowerCase();
      if (!["student", "teacher", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });
      if (role === "admin") return res.status(400).json({ error: "Admin role cannot be assigned via this endpoint" });

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.role === "admin") return res.status(400).json({ error: "Cannot modify admin user" });

      user.role = role;
      await user.save();
      return res.json({ user: sanitizeUser(user) });
    })
  );

  router.post(
    "/users/:id/block",
    authRequired(config),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const block = !!req.body?.block;

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.role === "admin") return res.status(400).json({ error: "Cannot block admin user" });

      user.blocked = block;
      await user.save();
      return res.json({ user: sanitizeUser(user) });
    })
  );

  return router;
}

module.exports = { makeAdminRoutes };

