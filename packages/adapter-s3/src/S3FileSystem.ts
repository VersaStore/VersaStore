import type { GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import {
    DeleteObjectCommand,
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

    public async has(path: string): Promise<boolean> {
        return this.getMetadata(path)
            .then(() => true)
            .catch(() => false);
    }

    public async write(
        file: FileSystemFile,
        meta?: FileMetadata,
    ): Promise<void> {
        const command = new PutObjectCommand({
            ...this.bucketConfig,
            Key: file.getPath(),
            Body: file.getContent().getContent(),
            ContentType: meta?.contentType,
        });

        await this.s3.send(command);
    }

    public async read(path: string): Promise<FileSystemFile> {
        const command = new GetObjectCommand({
            ...this.bucketConfig,
            Key: path,
        });

        const object: GetObjectCommandOutput = await this.s3.send(command);

        const body = await object.Body?.transformToByteArray();

        return new FileSystemFile(
            path,
            new Uint8ArrayFileContent(body ?? new Uint8Array(0)),
        );
    }

    private metadataToFileMetadata(meta: S3Metadata): FileMetadata {
        return {
            contentType: meta.ContentType,
            size: meta.ContentLength,
            lastModified: meta.LastModified,
        };
    }

    public async destroy(path: string | FileSystemFile): Promise<void> {
        if (!(typeof path === 'string')) {
            return this.destroy(path.getPath());
        }

        const command = new DeleteObjectCommand({
            Bucket: this.bucketConfig.Bucket,
            Key: path,
        });

        await this.s3.send(command);
    }
}
