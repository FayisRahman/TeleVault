import { client } from "../config/telegram.js";
import { CHANNEL_ID } from "../config/env.js";
import { CustomFile } from "telegram/client/uploads.js";
import fs from "fs";

// NOTE: We don't need the complex monkey-patch for part sizes anymore. 
// By splitting the file into 2GB chunks, each chunk will naturally use 512KB parts,
// which stays safely under the Telegram limit of 4000 parts per file object.
// (2,000,000,000 bytes / 512KB = ~3814 parts).

const MULTIPART_MARKER = "!!! [MULTIPART_METADATA] !!!";

/**
 * Fetches and formats messages from the channel.
 */
async function fetchMessages(limit) {
  const messages = await client.getMessages(CHANNEL_ID, {
    limit: limit ? parseInt(limit) : undefined
  });

  const partIdsSet = new Set();
  const metadataMap = new Map();

  // First pass: Identify all parts that belong to a multipart file
  messages.forEach(msg => {
    if (msg.message && msg.message.startsWith(MULTIPART_MARKER)) {
      try {
        const jsonStr = msg.message.replace(MULTIPART_MARKER, "").trim();
        const metadata = JSON.parse(jsonStr);
        metadata.parts.forEach(id => partIdsSet.add(id));
        metadataMap.set(msg.id, metadata);
      } catch (e) {
        console.error("Failed to parse metadata for message", msg.id);
      }
    }
  });

  return messages
    .filter(msg => {
      // Hide messages that are just parts of a larger file
      if (partIdsSet.has(msg.id)) return false;
      return msg.message || msg.media;
    })
    .map(msg => {
      const metadata = metadataMap.get(msg.id);
      if (metadata) {
        return {
          id: msg.id,
          message: metadata.name,
          date: new Date(msg.date * 1000).toLocaleString(),
          hasMedia: true,
          isMultipart: true,
          totalSize: metadata.totalSize,
          downloadLink: `http://localhost:3000/download/${msg.id}`,
          thumbnailLink: null
        };
      }

      return {
        id: msg.id,
        message: msg.message || "[No Text]",
        date: new Date(msg.date * 1000).toLocaleString(),
        hasMedia: !!msg.media,
        downloadLink: msg.media ? `http://localhost:3000/download/${msg.id}` : null,
        thumbnailLink: msg.media ? `http://localhost:3000/download/thumbnail/${msg.id}` : null
      };
    });
}

/**
 * Splits a file into multiple chunks on disk.
 */
async function splitFile(inputPath, chunkLimit) {
  const stats = fs.statSync(inputPath);
  const totalSize = stats.size;
  const parts = [];
  const buffer = Buffer.alloc(64 * 1024); // 64KB buffer for copying

  let bytesRead = 0;
  let partIndex = 1;

  const fd = fs.openSync(inputPath, "r");

  try {
    while (bytesRead < totalSize) {
      const partPath = `${inputPath}.part${partIndex}`;
      const partSize = Math.min(chunkLimit, totalSize - bytesRead);
      const partFd = fs.openSync(partPath, "w");

      let partBytesWritten = 0;
      while (partBytesWritten < partSize) {
        const toRead = Math.min(buffer.length, partSize - partBytesWritten);
        const read = fs.readSync(fd, buffer, 0, toRead, bytesRead);
        fs.writeSync(partFd, buffer, 0, read);
        bytesRead += read;
        partBytesWritten += read;
      }

      fs.closeSync(partFd);
      parts.push(partPath);
      partIndex++;
    }
  } finally {
    fs.closeSync(fd);
  }

  return parts;
}

/**
 * Handles file uploads to the Telegram channel.
 */
async function uploadBigFile(params) {
  const { file, message, thumb, progressCallback } = params;
  const stats = fs.statSync(file);
  const fileSize = stats.size;
  const fileName = file.split("/").pop();

  const CHUNK_SIZE_LIMIT = 1000000000; // 1GB

  if (fileSize <= CHUNK_SIZE_LIMIT) {
    return await uploadSingleFile(file, fileName, fileSize, message, thumb, progressCallback);
  } else {
    console.log(`!!! [Telegram Service] Large file detected (${(fileSize / 1e9).toFixed(2)} GB). Splitting...`);
    const partPaths = await splitFile(file, CHUNK_SIZE_LIMIT);
    const partIds = [];

    for (let i = 0; i < partPaths.length; i++) {
      console.log(`!!! [Telegram Service] Uploading part ${i + 1}/${partPaths.length}`);
      const uploaded = await uploadSingleFile(
        partPaths[i],
        `${fileName}.part${i + 1}`,
        fs.statSync(partPaths[i]).size,
        `Part ${i + 1} of ${fileName}`,
        null,
        (p) => {
          const overallProgress = (i + p) / partPaths.length;
          if (progressCallback) progressCallback(overallProgress);
        }
      );
      partIds.push(uploaded.id);
      fs.unlinkSync(partPaths[i]); // Clean up part
    }

    const metadata = {
      type: "multipart",
      name: fileName,
      parts: partIds,
      totalSize: fileSize
    };

    return await client.sendMessage(CHANNEL_ID, {
      message: `${MULTIPART_MARKER}\n${JSON.stringify(metadata)}`
    });
  }
}

/**
 * Core upload logic for a single (possibly chunked) file part.
 */
async function uploadSingleFile(filePath, name, size, message, thumb, progressCallback) {
  const toUpload = new CustomFile(name, size, filePath);
  const uploadedFile = await client.uploadFile({
    file: toUpload,
    workers: 10,
    onProgress: (progress) => {
      if (progressCallback) progressCallback(progress);
    }
  });

  return await client.sendMessage(CHANNEL_ID, {
    file: uploadedFile,
    message: message,
    thumb: thumb,
    forceDocument: true
  });
}

/**
 * Sends a standard message.
 */
async function sendMessage(params) {
  return await client.sendMessage(CHANNEL_ID, params);
}

export { fetchMessages, sendMessage, uploadBigFile, MULTIPART_MARKER };
