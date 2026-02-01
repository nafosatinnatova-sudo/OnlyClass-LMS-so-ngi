const express = require("express");
const User = require("../models/User");
const { sanitizeUser } = require("../utils/sanitize");
const { asyncHandler } = require("../middleware/asyncHandler");

function makeMeRoutes({ config, authRequired }) {
  const router = express.Router();

  router.get(
    "/",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      return res.json({ user: sanitizeUser(user) });
    })
  );

  router.patch(
    "/",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const fullName = req.body?.fullName !== undefined ? String(req.body.fullName).trim() : undefined;
      const phone = req.body?.phone !== undefined ? String(req.body.phone).trim() : undefined;
      const ageRaw = req.body?.age;
      const age = ageRaw === undefined ? undefined : ageRaw === "" || ageRaw === null ? null : Number(ageRaw);

      if (fullName !== undefined && fullName.length < 3) return res.status(400).json({ error: "Full name is required" });
      if (age !== undefined && age !== null && (!Number.isFinite(age) || age < 5 || age > 120))
        return res.status(400).json({ error: "Valid age is required" });

      const user = await User.findById(req.user._id);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (fullName !== undefined) user.fullName = fullName;
      if (phone !== undefined) user.phone = phone || null;
      if (age !== undefined) user.age = age;
      await user.save();

      return res.json({ user: sanitizeUser(user) });
    })
  );

  return router;
}

module.exports = { makeMeRoutes };

