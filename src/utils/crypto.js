const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function uuid() {
  return crypto.randomUUID();
}

module.exports = { sha256, uuid };

