import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const API_ID = parseInt(process.env.API_ID);
export const API_HASH = process.env.API_HASH;
export const SESSION_ID = process.env.SESSION_ID;
export const CHANNEL_ID = process.env.CHANNEL_ID;
export const PORT = parseInt(process.env.PORT) || 3000;

if (!API_ID || !API_HASH) {
  console.error("❌ CRITICAL: API_ID or API_HASH is missing from .env!");
}
