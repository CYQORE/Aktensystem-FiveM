import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Client as MinioClient } from "minio";
import { config } from "../common/config.js";

/** MinIO/S3-Storage-Abstraktion für das Dokumentenmanagement. */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: MinioClient;
  readonly bucket = config.minio.bucket;

  constructor() {
    this.client = new MinioClient({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSsl,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket);
    } catch (err) {
      // Storage darf beim Boot fehlen (Dev ohne MinIO) — nur warnen
      this.logger.warn(`MinIO nicht erreichbar: ${(err as Error).message}`);
    }
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.putObject(this.bucket, key, body, body.length, {
      "Content-Type": mimeType,
    });
  }

  /** Zeitlich begrenzte Download-URL (Default 1h). */
  presignedGet(key: string, expirySec = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySec);
  }

  remove(key: string): Promise<void> {
    return this.client.removeObject(this.bucket, key);
  }
}
