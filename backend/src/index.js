import express from "express";
import cors from "cors";

// Logging to verify start
console.log("-----------------------------------------");
console.log("🚀 INITIALIZING TELEGRAM BOT SERVER...");
console.log("-----------------------------------------");

const app = express();
app.use(cors());
app.use(express.json());

async function start() {
  // 1. Load config first (this runs dotenv)
  const { PORT, API_ID, CHANNEL_ID } = await import("./config/env.js");

  console.log(`[System] Config Loaded: API_ID=${API_ID}, Channel=${CHANNEL_ID}`);

  // 2. Load routes/lib that depend on config
  const { startClient } = await import("./config/telegram.js");
  const { default: messageRoutes } = await import("./routes/messages.js");
  const { default: downloadRoutes } = await import("./routes/downloads.js");

  app.use("/messages", messageRoutes);
  app.use("/download", downloadRoutes);

  app.listen(PORT, async () => {
    await startClient();
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("❌ Failed to start server:", err);
});
