const fs = require("fs");
const path = require("path");

function notFound(req, res) {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  const p404 = path.join(process.cwd(), "public", "404.html");
  try {
    if (fs.existsSync(p404)) return res.status(404).sendFile(p404);
  } catch {
    // ignore
  }
  return res.status(404).send("Not found");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number(err.statusCode || err.status || 500);
  const requestId = req.requestId;

  if (status >= 500) {
    console.error(`[${requestId}]`, err);
  }

  const message = status >= 500 ? "Internal server error" : err.message || "Error";

  if (req.path.startsWith("/api/")) {
    return res.status(status).json({ error: message, requestId });
  }
  if (status === 404) {
    const p404 = path.join(process.cwd(), "public", "404.html");
    try {
      if (fs.existsSync(p404)) return res.status(404).sendFile(p404);
    } catch {
      // ignore
    }
  }
  return res.status(status).send(message);
}

module.exports = { notFound, errorHandler };

