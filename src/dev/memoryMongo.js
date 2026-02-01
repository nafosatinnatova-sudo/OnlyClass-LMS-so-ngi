const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

async function startMemoryMongo() {
  if (mongo) return mongo;
  mongo = await MongoMemoryServer.create({
    // let it pick a compatible default version
  });
  return mongo;
}

async function stopMemoryMongo() {
  if (!mongo) return;
  await mongo.stop();
  mongo = null;
}

module.exports = { startMemoryMongo, stopMemoryMongo };

