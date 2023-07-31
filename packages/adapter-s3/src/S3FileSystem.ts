import type { S3Client } from '@aws-sdk/client-s3';
import {
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import { FileSystemFile, Uint8ArrayFileContent } from '@versastore/core';

interface S3Metadata {
    ContentType?: string;
    ContentLength?: number;
    LastModified?: Date;
}

export class S3FileSystem implements FileSystemInterface {
    private readonly bucketConfig: { Bucket: string };

    constructor(private readonly s3: S3Client, readonly bucket: string) {
        this.bucketConfig = { Bucket: bucket };
    }

    public async getMetadata(path: string): Promise<FileMetadata> {
        const command = new HeadObjectCommand({
            ...this.bucketConfig,
            Key: path,
        });

        const object = await this.s3.send(command);

        return this.metadataToFileMetadata(object);
    }

    public async hasFile(path: string): Promise<boolean> {
        return this.getMetadata(path)
            .then(() => true)
            .catch(() => false);
    }

    public async writeFile(file: FileSystemFile): Promise<void> {
        const command = new PutObjectCommand({
            ...this.bucketConfig,
            Key: file.getPath(),
            Body: file.getContent().getContent(),
            ContentType: file.getMetadata().contentType,
        });

        await this.s3.send(command);
    }

    public async readFile(path: string): Promise<FileSystemFile> {
        const command = new GetObjectCommand({
            ...this.bucketConfig,
            Key: path,
        });

        const object = await this.s3.send(command);

        const body = await object.Body?.transformToByteArray();

        return new FileSystemFile(
            path,
            new Uint8ArrayFileContent(body ?? new Uint8Array(0)),
            this.metadataToFileMetadata(object),
        );
    }

    private metadataToFileMetadata(meta: S3Metadata): FileMetadata {
        return {
            contentType: meta.ContentType,
            contentLength: meta.ContentLength,
            lastModified: meta.LastModified,
        };
    }
}
