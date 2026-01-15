import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isProduction = process.env.NODE_ENV === "production";

const s3Client = isProduction && process.env.S3_ENDPOINT ? new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
}) : null;

const BUCKET = process.env.S3_BUCKET || "golmanager-assets";

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!s3Client) {
    throw new Error("S3 client not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
  }));

  return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
}

export async function getFromS3(key: string): Promise<Buffer> {
  if (!s3Client) {
    throw new Error("S3 client not configured");
  }

  const response = await s3Client.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));

  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client) {
    throw new Error("S3 client not configured");
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!s3Client) {
    throw new Error("S3 client not configured");
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function listS3Objects(prefix: string): Promise<string[]> {
  if (!s3Client) {
    throw new Error("S3 client not configured");
  }

  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  }));

  return (response.Contents || []).map(obj => obj.Key || "").filter(Boolean);
}

export function isS3Configured(): boolean {
  return !!(s3Client && process.env.S3_BUCKET);
}
