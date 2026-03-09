import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;

const stringSession = new StringSession("");

(async () => {

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Enter phone number: "),
    password: async () => await input.text("Enter password: "),
    phoneCode: async () => await input.text("Enter OTP: "),
  });

  console.log("You are logged in!");

  console.log("SESSION:", client.session.save());

})();