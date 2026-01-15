import { Storage } from "@google-cloud/storage";

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";

let storageClient: Storage | null = null;

function getStorage(): Storage {
  if (!storageClient) {
    storageClient = new Storage();
  }
  return storageClient;
}

export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  contentType: string = "image/png"
): Promise<string> {
  if (!bucketId) {
    throw new Error("Object storage bucket not configured");
  }

  try {
    const storage = getStorage();
    const buffer = Buffer.from(base64Data, "base64");
    const bucket = storage.bucket(bucketId);
    const filePath = `public/logos/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
      public: true,
    });

    return `https://storage.googleapis.com/${bucketId}/${filePath}`;
  } catch (error) {
    console.error("Error uploading to object storage:", error);
    throw error;
  }
}

export async function deleteObject(filePath: string): Promise<void> {
  if (!bucketId) {
    throw new Error("Object storage bucket not configured");
  }

  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketId);
    const file = bucket.file(filePath);
    await file.delete();
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

export function isStorageConfigured(): boolean {
  return !!bucketId;
}
