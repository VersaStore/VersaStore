import type {
    GetObjectCommandOutput,
    HeadObjectCommandOutput,
    S3Client,
} from '@aws-sdk/client-s3';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import {
    FileSystemFile,
    ListOptions,
    Uint8ArrayFileContent,
} from '@versastore/core';
import path from 'path';

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

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const normalizedPath = this.normalize(filepath);

        const command = new HeadObjectCommand({
            ...this.bucketConfig,
            Key: normalizedPath,
        });

        const object: HeadObjectCommandOutput = await this.s3
            .send(command)
            .catch(() => {
                throw new Error(`File ${normalizedPath} not found`);
            });

        return this.metadataToFileMetadata(object);
    }

    public async has(filepath: string): Promise<boolean> {
        return this.getMetadata(this.normalize(filepath))
            .then(() => true)
            .catch(() => false);
    }

    public async write(
        file: FileSystemFile,
        meta?: FileMetadata,
    ): Promise<void> {
        const command = new PutObjectCommand({
            ...this.bucketConfig,
            Key: this.normalize(file.getPath()),
            Body: file.getContent().getContent(),
            ContentType: meta?.contentType,
        });

        await this.s3.send(command);
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const normalizedPath = this.normalize(filepath);

        const command = new GetObjectCommand({
            ...this.bucketConfig,
            Key: normalizedPath,
        });

        const object: GetObjectCommandOutput = await this.s3
            .send(command)
            .catch(() => {
                throw new Error(`File ${normalizedPath} not found`);
            });

        const body = await object.Body?.transformToByteArray();

        return new FileSystemFile(
            normalizedPath,
            new Uint8ArrayFileContent(body ?? new Uint8Array(0)),
        );
    }

    private metadataToFileMetadata(s3meta: S3Metadata): FileMetadata {
        const meta: FileMetadata = {};

        if (s3meta.ContentLength) {
            meta.size = s3meta.ContentLength;
        }

        if (s3meta.LastModified) {
            meta.lastModified = s3meta.LastModified;
        }

        if (s3meta.ContentType?.length) {
            meta.contentType = s3meta.ContentType;
        }

        return meta;
    }

    public async destroy(
        filepathOrFile: string | FileSystemFile,
    ): Promise<void> {
        if (typeof filepathOrFile !== 'string') {
            return this.destroy(filepathOrFile.getPath());
        }

        const normalizedPath = this.normalize(filepathOrFile);

        await this.getMetadata(normalizedPath);

        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucketConfig.Bucket,
                Key: normalizedPath,
            }),
        );
    }

    public async list(
        dirPath: string,
        options: ListOptions = ListOptions.DEFAULT,
    ): Promise<string[]> {
        let normalizedPath = this.normalize(dirPath);

        if (!normalizedPath.endsWith('/') && normalizedPath !== '/') {
            normalizedPath = normalizedPath + '/';
        }

        const command = new ListObjectsCommand({
            ...this.bucketConfig,
            Prefix: normalizedPath,
        });

        const output = await this.s3.send(command);

        let files = (output.Contents ?? [])
            .filter(({ Key }): boolean => Key !== undefined)
            .map(({ Key }): string => this.normalize(Key!));

        if (!(options & ListOptions.INCLUDE_DOTFILES)) {
            files = files.filter(
                (filepath): boolean =>
                    !filepath
                        .split('/')
                        .some((particle) => particle.startsWith('.')),
            );
        }

        if (!(options & ListOptions.RECURSIVE)) {
            files = files.filter(
                (filepath): boolean =>
                    normalizedPath === path.dirname(this.normalize(filepath)),
            );
        }

        return files;
    }

    private normalize(filepath: string): string {
        if (filepath === '/') {
            return filepath;
        }

        if (!filepath.startsWith('/')) {
            return this.normalize('/' + filepath);
        }

        return path.normalize(filepath);
    }
}
