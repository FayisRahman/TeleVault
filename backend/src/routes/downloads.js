import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import fs from "fs";
import { client } from "../config/telegram.js";
import { CHANNEL_ID } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// This ensures the cache is ALWAYS at projectRoot/backend/cache
const BACKEND_ROOT = path.resolve(__dirname, "../../");
const CACHE_DIR = path.join(BACKEND_ROOT, "cache");

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

import { MULTIPART_MARKER } from "../lib/telegram.js";

router.get("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    const messages = await client.getMessages(CHANNEL_ID, {
      ids: parseInt(messageId)
    });

    if (!messages || messages.length === 0) {
      return res.status(404).send("File not found.");
    }

    const message = messages[0];
    let fileName = `file_${messageId}`;
    let parts = [];

    // Check if this is a multipart metadata message
    if (message.message && message.message.startsWith(MULTIPART_MARKER)) {
      const jsonStr = message.message.replace(MULTIPART_MARKER, "").trim();
      const metadata = JSON.parse(jsonStr);
      fileName = metadata.name;
      parts = metadata.parts;
    } else if (message.media) {
      // Standard single file
      if (message.media.document) {
        const attr = message.media.document.attributes.find(a => a.fileName);
        if (attr) fileName = attr.fileName;
      }
      parts = [parseInt(messageId)];
    } else {
      return res.status(404).send("Message has no media or valid metadata.");
    }

    // const cachePath = path.join(CACHE_DIR, `${messageId}_${fileName}`);

    // 1. Check cache (Commented out to save disk space)
    /*
    if (fs.existsSync(cachePath)) {
      console.log(`Serving from cache: ${fileName}`);
      return res.download(cachePath, fileName);
    }
    */

    // 2. Stream all parts sequentially
    console.log(`Streaming ${parts.length} parts from Telegram: ${fileName}`);

    // Sanitize filename for header
    const safeFileName = encodeURIComponent(fileName);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${safeFileName}`);
    res.setHeader("Content-Type", "application/octet-stream");

    // const cacheWriter = fs.createWriteStream(cachePath);

    for (const partId of parts) {
      console.log(` -> Fetching part ${partId}`);
      const partMessages = await client.getMessages(CHANNEL_ID, { ids: partId });
      if (!partMessages || !partMessages[0].media) continue;

      for await (const chunk of client.iterDownload({
        file: partMessages[0].media,
        requestSize: 4 * 1024 * 1024, // 4MB chunks
      })) {
        res.write(chunk);
        // cacheWriter.write(chunk);
      }
    }

    res.end();
    // cacheWriter.end();

  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).send("Error downloading file.");
    }
  }
});

// GET thumbnail by message ID
router.get("/thumbnail/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const channel = process.env.CHANNEL_ID;

    const messages = await client.getMessages(channel, {
      ids: parseInt(messageId)
    });

    if (!messages || messages.length === 0 || !messages[0].media) {
      return res.status(404).send("Media not found.");
    }

    const message = messages[0];
    const media = message.media;

    // Try to find a thumbnail in the media object
    // For Photos, it's usually just the smallest size
    // For Documents, it's media.document.thumbs
    const buffer = await client.downloadMedia(media, {
      thumbSize: 0, // Gets the smallest thumbnail
    });

    if (!buffer) {
      return res.status(404).send("Thumbnail not available.");
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (error) {
    console.error("Thumbnail error:", error);
    res.status(500).send("Error fetching thumbnail.");
  }
});

export default router;
