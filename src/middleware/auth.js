const User = require("../models/User");
const { verifyAccessToken } = require("../auth/tokens");

function getAccessToken(req) {
  // cookie auth (preferred)
  const cookieToken = req.cookies?.oc_at;
  if (cookieToken) return String(cookieToken);

  // backwards compatibility: Authorization header
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type === "Bearer" && token) return token;
  return null;
}

function authRequired(config) {
  return async (req, res, next) => {
    try {
      const token = getAccessToken(req);
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const payload = verifyAccessToken({ token, config });
      const userId = payload.sub;

      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (user.blocked) return res.status(403).json({ error: "User is blocked" });
      if (Number(payload.tv) !== Number(user.tokenVersion)) return res.status(401).json({ error: "Unauthorized" });

      req.auth = payload;
      req.user = user;
      return next();
    } catch (e) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

function requireTeacherOrAdmin(req, res, next) {
  if (!req.user?.role) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "teacher" && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  return next();
}

module.exports = { authRequired, requireRole, requireTeacherOrAdmin };

