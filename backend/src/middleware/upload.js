import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // __dirname is backend/src/middleware
    // we want projectRoot/backend/uploads
    const backendRoot = path.resolve(__dirname, "../../");
    const uploadPath = path.join(backendRoot, "uploads");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

/**
 * Generates a thumbnail for an image.
 */
async function generateThumbnail(inputPath) {
  const thumbPath = `${inputPath}_thumb.jpg`;
  const ext = path.extname(inputPath).toLowerCase();
  const videoExts = [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm"];

  try {
    if (videoExts.includes(ext)) {
      // Handle Video Thumbnail
      return new Promise((resolve, reject) => {
        const tempThumb = `${inputPath}_temp_thumb.jpg`;
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ["00:00:01"],
            filename: path.basename(tempThumb),
            folder: path.dirname(tempThumb),
            size: "320x?"
          })
          .on("end", async () => {
            try {
              // Now resize and compress with sharp for consistency
              await sharp(tempThumb)
                .resize(90, 90, { fit: "cover" })
                .toFormat("jpeg")
                .toFile(thumbPath);
              fs.unlinkSync(tempThumb); // Cleanup temp
              resolve(thumbPath);
            } catch (e) {
              reject(e);
            }
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            resolve(null);
          });
      });
    } else {
      // Handle Image Thumbnail (Existing Logic)
      await sharp(inputPath)
        .resize(90, 90, { fit: "cover" })
        .toFormat("jpeg")
        .toFile(thumbPath);
      return thumbPath;
    }
  } catch (error) {
    console.log("No thumbnail generated:", error.message);
    return null;
  }
}

export { upload, generateThumbnail };
