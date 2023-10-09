import { LocalFileSystem } from '../src';
import type { InitialState } from '@versastore/core/tests/FileSystemInterfaceTest';
import {
    deleteDirectoryRecursive,
    FileSystemInterfaceTest,
} from '@versastore/core/tests/FileSystemInterfaceTest';

import * as os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

FileSystemInterfaceTest<LocalFileSystem, { path: string }>(
    LocalFileSystem.name,
    async (initialState: InitialState) => {
        const tempDir =
            os.tmpdir() +
            '/versa-store/local/' +
            Math.random().toString(36).substring(7) +
            '/';

        await fs.mkdir(tempDir, { recursive: true });

        for (const { file, meta } of initialState) {
            await fs.mkdir(path.join(tempDir, path.dirname(file.getPath())), {
                recursive: true,
            });

            await fs.writeFile(
                path.join(tempDir, file.getPath()),
                file.getContent().getContentAsBuffer(),
            );

            if (meta.lastAccessed || meta.lastModified) {
                await fs.utimes(
                    path.join(tempDir, file.getPath()),
                    meta.lastAccessed ?? Date.now(),
                    meta.lastModified ?? Date.now(),
                );
            }
        }

        return {
            fs: new LocalFileSystem(tempDir),
            lifetimeOpts: { path: tempDir },
        };
    },
    async (_localFS: LocalFileSystem, lifetimeOpts) =>
        deleteDirectoryRecursive(lifetimeOpts.path),
    {
        checkContentType: false,
        hasLastAccessed: true,
        hasCreated: true,
    },
);
