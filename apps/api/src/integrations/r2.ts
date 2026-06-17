/**
 * Integração Cloudflare R2 (S3-compatible)
 * Usado para armazenar PDFs (PGR, OS, EPI, certificados)
 *
 * Variáveis de ambiente:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET
 * - R2_PUBLIC_URL (URL pública do bucket para leitura)
 * - R2_ENDPOINT (https://account_id.r2.cloudflarestorage.com)
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 credentials não configuradas");
  }

  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function isConfigured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}

export async function uploadToR2(
  key: string,
  body: string | Buffer,
  contentType: string = "application/octet-stream",
): Promise<string> {
  if (!isConfigured()) {
    console.warn(`[R2] Não configurado — upload simulado de ${key}`);
    // Retorna URL fake para que a app não quebre
    return `https://placeholder.r2.dev/${key}`;
  }

  const client = getClient();
  const bucket = process.env.R2_BUCKET!;
  const buffer = typeof body === "string" ? Buffer.from(body, "utf-8") : body;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!isConfigured()) return `${process.env.R2_PUBLIC_URL}/${key}`;
  const client = getClient();
  const bucket = process.env.R2_BUCKET!;
  return getSignedUrl(client, new (await import("@aws-sdk/client-s3")).GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
