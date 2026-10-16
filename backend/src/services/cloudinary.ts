import { randomUUID } from "node:crypto";
import cloudinary from "cloudinary";
import { env } from "../config/env.js";
import { pool } from "../config/database.js";

function configured(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export async function createPosterSignature(adminId: string, sessionId: string) {
  if (!configured()) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = randomUUID();
  const folder = env.CLOUDINARY_UPLOAD_FOLDER;
  const params = { folder, overwrite: false, public_id: publicId, timestamp };
  const signature = cloudinary.v2.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await pool.query(
    "INSERT INTO upload_intents (public_id, admin_id, session_id, expires_at) VALUES ($1, $2, $3, $4)",
    [publicId, adminId, sessionId, expiresAt],
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

export async function verifyPosterUpload(adminId: string, sessionId: string, publicId: string, suppliedUrl: string) {
  if (!configured()) return null;
  const intent = await pool.query(
    `SELECT public_id FROM upload_intents
     WHERE public_id = $1 AND admin_id = $2 AND session_id = $3
       AND consumed_at IS NULL AND expires_at > NOW()`,
    [publicId, adminId, sessionId],
  );
  if (intent.rowCount !== 1) return null;

  const asset = await cloudinary.v2.api.resource(publicId, { resource_type: "image", type: "upload" });
  const folderPrefix = `${env.CLOUDINARY_UPLOAD_FOLDER}/`;
  const isAllowed = asset.resource_type === "image"
    && asset.public_id === publicId
    && (asset.asset_folder === env.CLOUDINARY_UPLOAD_FOLDER || asset.public_id.startsWith(folderPrefix))
    && ["jpg", "jpeg", "png", "webp"].includes(asset.format)
    && Number(asset.bytes) <= 8 * 1024 * 1024
    && asset.secure_url === suppliedUrl;
  if (!isAllowed) return null;
  const consumed = await pool.query(
    `UPDATE upload_intents SET consumed_at = NOW()
     WHERE public_id = $1 AND admin_id = $2 AND session_id = $3
       AND consumed_at IS NULL AND expires_at > NOW() RETURNING public_id`,
    [publicId, adminId, sessionId],
  );
  if (consumed.rowCount !== 1) return null;
  return { publicId, url: asset.secure_url as string };
}
