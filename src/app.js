const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { requestContext } = require("./middleware/requestContext");
const { authStrictLimiter, authLimiter, apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errors");
const { authRequired, requireRole, requireTeacherOrAdmin } = require("./middleware/auth");

const { makeAuthRoutes } = require("./routes/authRoutes");
const { makeMeRoutes } = require("./routes/meRoutes");
const { makeAdminRoutes } = require("./routes/adminRoutes");
const { makeLmsRoutes } = require("./routes/lmsRoutes");

function getBaseUrl(req, { config }) {
  // Prefer explicit origin if frontend is separate or you want canonical URL stability
  if (config.APP_ORIGIN) return String(config.APP_ORIGIN).replace(/\/+$/, "");
  // With trust proxy enabled in prod, req.protocol reflects x-forwarded-proto.
  return `${req.protocol}://${req.get("host")}`;
}

function buildSitemapXml(baseUrl) {
  const urls = ["/", "/login", "/register", "/privacy", "/terms"];
  const body = urls.map((p) => `  <url><loc>${baseUrl}${p}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildCspDirectives({ config }) {
  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:", "https:"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", "https:"],
    frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
    upgradeInsecureRequests: config.isProd ? [] : null
  };
}

function createApp({ config }) {
  const app = express();

  if (config.isProd) {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");

  app.use(requestContext);

  // Basic security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: buildCspDirectives({ config })
      }
    })
  );

  // Optional CORS (only if frontend is separate origin)
  if (config.APP_ORIGIN) {
    app.use(
      cors({
        origin: config.APP_ORIGIN,
        credentials: true
      })
    );
  }

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  // Health
  app.get("/api/health", (req, res) =>
    res.json({
      ok: true,
      env: config.NODE_ENV,
      db: { readyState: mongoose.connection.readyState }
    })
  );

  // SEO: dynamic robots/sitemap (avoids hardcoding localhost in production)
  app.get("/robots.txt", (req, res) => {
    const baseUrl = getBaseUrl(req, { config });
    res.type("text/plain").send(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = getBaseUrl(req, { config });
    res.type("application/xml").send(buildSitemapXml(baseUrl));
  });

  // Rate limit
  app.use("/api", apiLimiter);
  app.use("/api/auth/login", authStrictLimiter);
  app.use("/api/auth/register", authStrictLimiter);
  app.use("/api/auth", authLimiter);

  // Routes
  app.use("/api/auth", makeAuthRoutes({ config }));
  app.use("/api/me", makeMeRoutes({ config, authRequired }));
  app.use("/api/admin", makeAdminRoutes({ config, authRequired, requireRole }));
  app.use("/api", makeLmsRoutes({ config, authRequired, requireRole, requireTeacherOrAdmin }));

  // Static frontend
  const PUBLIC_DIR = path.join(process.cwd(), "public");
  app.use(express.static(PUBLIC_DIR));

  app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
  app.get("/auth", (req, res) => res.redirect(302, "/login"));
  app.get("/login", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "login.html")));
  app.get("/register", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "register.html")));
  app.get("/privacy", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "privacy.html")));
  app.get("/terms", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "terms.html")));
  app.get("/dashboard", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "dashboard.html")));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

