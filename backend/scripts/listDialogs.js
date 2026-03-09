import { client, startClient } from "../src/config/telegram.js";

async function listDialogs() {
  await startClient();

  const dialogs = await client.getDialogs({});

  console.log("\n--- YOUR DIALOGS ---");
  dialogs.forEach(dialog => {
    console.log(`Title: ${dialog.title} | ID: ${dialog.id} | Type: ${dialog.entity.className}`);
  });
  console.log("--------------------\n");

  console.log("TIP: Use the numerical ID (including the minus sign) or the username for CHANNEL_ID in your .env");
}

listDialogs();
