import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicBaseUrl: string;

  constructor() {
    // Initialize Cloudflare R2 client
    this.s3Client = new S3Client({
      region: "auto", // R2 uses "auto"
      endpoint: process.env.R2_ENDPOINT, // e.g., https://abc123.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    this.bucketName = process.env.R2_BUCKET_NAME || "audio-files";
    this.publicBaseUrl =
      process.env.R2_PUBLIC_BASE_URL || "https://pub-xxxx.r2.dev";
  }

  // Upload file to R2
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string; key: string }> {
    const timestamp = Date.now();
    const key = `audio/${userId}/${timestamp}-${file.originalname}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Optional: only needed if using R2 public access
      },
    });

    await upload.done();

    // Construct public URL for the file
    const url = `${this.publicBaseUrl}/${key}`;

    return { url, key };
  }

  // Delete file from R2
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // Extract key from URL for deletion
  extractKeyFromUrl(url: string): string {
    const urlParts = url.split("/");
    // Remove protocol + domain
    return urlParts.slice(3).join("/");
  }
}
