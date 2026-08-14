import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { EvidenceFile } from "../models/EvidenceFile.js";
import type { EvidenceStorage } from "../types/EvidenceStorage.js";

export class S3EvidenceStorage implements EvidenceStorage {
  private readonly bucket: string;

  constructor(
    private readonly client: S3Client = new S3Client({}),
    bucket: string | undefined = process.env.EVIDENCE_BUCKET
  ) {
    if (!bucket) throw new Error("EVIDENCE_BUCKET is required");
    this.bucket = bucket;
  }

  async save(requestId: string, pdf: Buffer): Promise<EvidenceFile> {
    const storageKey = this.keyFor(requestId);
    const fileName = this.fileNameFor(requestId);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: pdf,
      ContentType: "application/pdf",
      ContentDisposition: `attachment; filename="${fileName}"`,
    }));
    return {
      requestId,
      fileName,
      contentType: "application/pdf",
      content: Buffer.from(pdf),
      storageKey,
    };
  }

  async get(requestId: string): Promise<EvidenceFile | null> {
    const storageKey = this.keyFor(requestId);
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }));
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return {
        requestId,
        fileName: this.fileNameFor(requestId),
        contentType: "application/pdf",
        content: Buffer.from(bytes),
        storageKey,
      };
    } catch (error: unknown) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  private keyFor(requestId: string): string {
    return `evidence/${requestId}/evidence.pdf`;
  }

  private fileNameFor(requestId: string): string {
    return `purchase-request-${requestId}-evidence.pdf`;
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
    return candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404;
  }
}
