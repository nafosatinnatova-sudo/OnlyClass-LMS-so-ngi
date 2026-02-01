const { uuid } = require("../utils/crypto");

function requestContext(req, res, next) {
  const rid = req.headers["x-request-id"] ? String(req.headers["x-request-id"]) : uuid();
  req.requestId = rid;
  res.setHeader("x-request-id", rid);
  next();
}

module.exports = { requestContext };

