import {
    CreateBucketCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

import type { InitialState } from '@versastore/core/tests/FileSystemInterfaceTest';
import { FileSystemInterfaceTest } from '@versastore/core/tests/FileSystemInterfaceTest';
import { S3FileSystem } from '../src';

const s3Client: S3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:4566',
    region: process.env.S3_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
        accessKeyId: 'x',
        secretAccessKey: 'y',
    },
});

FileSystemInterfaceTest<S3FileSystem, { Bucket: string }>(
    S3FileSystem.name,
    async (initialState: InitialState) => {
        const Bucket = Math.random().toString(36).substring(7);

        await s3Client.send(new CreateBucketCommand({ Bucket }));

        for (const { file, meta } of initialState) {
            await s3Client.send(
                new PutObjectCommand({
                    Bucket,
                    Key: file.getPath(),
                    Body: file.getContent().getContentAsBuffer(),
                    ContentType: meta?.contentType,
                }),
            );
        }

        return {
            fs: new S3FileSystem(s3Client, Bucket),
            lifetimeOpts: { Bucket },
        };
    },
    () => Promise.resolve(),
    {
        checkContentType: true,
        hasLastAccessed: false,
        hasCreated: false,
    },
);
