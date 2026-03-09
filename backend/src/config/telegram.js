import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { API_ID, API_HASH, SESSION_ID } from "./env.js";

const stringSession = new StringSession(SESSION_ID);

const client = new TelegramClient(stringSession, API_ID, API_HASH, {
  connectionRetries: 5,
});

async function startClient() {
  if (!client.connected) {
    await client.connect();
    console.log("Telegram client connected");
  }
}

export { client, startClient };
