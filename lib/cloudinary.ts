import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary client. Lazy-configured per request — keeps env-var checks
 * close to the call site and avoids partial config at module load.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Generous free tier. Sign up at https://cloudinary.com.
 *
 * Uploaded photos land in the `pvs/gallery/<section>` folder for organisation.
 */

export const CLOUDINARY_ENV_VARS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export function isCloudinaryConfigured(): boolean {
  return CLOUDINARY_ENV_VARS.every((k) => !!process.env[k]);
}

export function missingCloudinaryEnvVars(): string[] {
  return CLOUDINARY_ENV_VARS.filter((k) => !process.env[k]);
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadedPhoto = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

/** Uploads a buffer to Cloudinary under pvs/gallery/<section>. */
export async function uploadPhotoBuffer(
  buffer: Buffer,
  section: string
): Promise<UploadedPhoto> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  configure();

  const safeSection = section.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return new Promise<UploadedPhoto>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `pvs/gallery/${safeSection}`,
        resource_type: "image",
        // Generate a reasonable web-optimized version automatically
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Removes a photo from Cloudinary by public_id. Best-effort. */
export async function deletePhotoByPublicId(publicId: string) {
  if (!isCloudinaryConfigured()) return;
  configure();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Cloudinary destroy failed for", publicId, err);
  }
}
