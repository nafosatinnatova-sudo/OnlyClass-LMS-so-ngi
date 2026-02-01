const mongoose = require("mongoose");

async function connectMongo(mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000
  });
  return mongoose.connection;
}

module.exports = { connectMongo };

