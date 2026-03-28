import { createServer } from "node:http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectMongo, disconnectMongo } from "./db/mongoose.js";
import { createApp } from "./app.js";

async function main(): Promise<void> {
  await connectMongo();
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error(error, "Failed to start server");
  process.exit(1);
});
