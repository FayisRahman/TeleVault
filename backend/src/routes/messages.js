import express from "express";
import { fetchMessages, sendMessage, uploadBigFile } from "../lib/telegram.js";
import { upload, generateThumbnail } from "../middleware/upload.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET latest messages
router.get("/", async (req, res) => {
  try {
    const { limit } = req.query;
    const messages = await fetchMessages(limit);
    res.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).send("Error fetching messages");
  }
});

// POST simple text message
router.post("/send", express.json(), async (req, res) => {
  try {
    const { message } = req.body;
    await sendMessage({ message });
    res.status(200).send("Sent successfully");
  } catch (error) {
    console.error("Send error:", error);
    res.status(500).send("Error sending");
  }
});

// POST upload file to Telegram
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { message } = req.body;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const thumbPath = await generateThumbnail(file.path);
    const absoluteFilePath = path.resolve(file.path);

    console.log(`!!! [Server] Starting upload process for: ${file.originalname}`);

    await uploadBigFile({
      file: absoluteFilePath,
      message: message,
      thumb: thumbPath,
      progressCallback: (progress) => {
        const percent = Math.round(progress * 100);
        console.log(`!!! [Server Progress] ${percent}%`);
      }
    });

    console.log(`!!! [Server] Upload complete: ${file.originalname}`);

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    res.status(200).send("File sent to Telegram successfully!");
  } catch (error) {
    console.error("!!! [Critical Upload Error] !!!");
    console.error(error);
    res.status(500).send(`Error processing upload: ${error.message}`);
  }
});

export default router;
