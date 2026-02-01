const { config } = require("./src/config");
const { connectMongo } = require("./src/db");
const { startMemoryMongo, stopMemoryMongo } = require("./src/dev/memoryMongo");
const { seedAll } = require("./src/seed");
const { createApp } = require("./src/app");

async function main() {
  let mongoUri = config.MONGODB_URI;
  if (!mongoUri && !config.isProd) {
    // Zero-config dev experience (no Docker needed)
    const mm = await startMemoryMongo();
    mongoUri = mm.getUri("onlyclass");
    console.log("Dev: started in-memory MongoDB");
  }

  if (!mongoUri) {
    console.error("MONGODB_URI is required in production.");
    process.exit(1);
  }

  try {
    await connectMongo(mongoUri);
  } catch (e) {
    if (config.isProd) throw e;
    // If local Mongo is missing, fall back to in-memory
    const mm = await startMemoryMongo();
    mongoUri = mm.getUri("onlyclass");
    console.log("Dev: MongoDB not reachable, using in-memory MongoDB");
    await connectMongo(mongoUri);
  }

  await seedAll({ config });

  const app = createApp({ config });
  const server = app.listen(config.PORT, () => {
    console.log(`OnlyClass LMS running on http://localhost:${config.PORT}`);
    console.log(`ENV: ${config.NODE_ENV}`);
    console.log(`Admin: ${config.ADMIN_EMAIL} / (set via ADMIN_PASSWORD env)`);
    if (!config.isProd) {
      console.log("Demo (dev only, if SEED_DEMO=true):");
      console.log("  student@onlyclass.local / Student123!");
      console.log("  teacher@onlyclass.local / Teacher123!");
    }
  });

  const shutdown = async () => {
    try {
      await stopMemoryMongo();
    } catch {
      // ignore
    }
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

