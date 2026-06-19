// One-off chunked upload to Cloudinary for files > 100 MB.
// Usage: node scripts/upload-video.js <absolute-path>
require("dotenv").config({ path: ".env.local" });
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/upload-video.js <abs-path>");
  process.exit(1);
}

cloudinary.uploader.upload_large(
  path,
  {
    resource_type: "video",
    folder: "pvs/videos/windows",
    tags: ["window-cleaning"],
    chunk_size: 20_000_000,
  },
  (err, res) => {
    if (err) {
      console.error("ERR:", err.message || err);
      process.exit(1);
    }
    console.log(res.secure_url);
  }
);
