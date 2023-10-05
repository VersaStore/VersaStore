import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import {
    BufferFileContent,
    FileSystemFile,
    ListOptions,
} from '@versastore/core';
import { promises as fs } from 'fs';
import path from 'path';

export class LocalFileSystem implements FileSystemInterface {
    constructor(private readonly basePath: string) {}

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const stats = await fs.stat(path.join(this.basePath, filepath));

        return {
            lastModified: stats.mtime,
            lastAccessed: stats.atime,
            created: stats.ctime,
            size: stats.size,
        };
    }

    public async has(filepath: string): Promise<boolean> {
        return fs
            .stat(path.join(this.basePath, filepath))
            .then(() => true)
            .catch(() => false);
    }

    public async write(file: FileSystemFile): Promise<void> {
        const baseDir = path.dirname(path.join(this.basePath, file.getPath()));

        await fs.mkdir(baseDir, { recursive: true });

        await fs.writeFile(
            path.join(this.basePath, file.getPath()),
            file.getContent().getContent(),
        );
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const fullPath = path.join(this.basePath, filepath);
        return new FileSystemFile(
            fullPath,
            new BufferFileContent(await fs.readFile(fullPath)),
        );
    }

    public async destroy(
        filepathOrFile: string | FileSystemFile,
    ): Promise<void> {
        if (!(typeof filepathOrFile === 'string')) {
            return this.destroy(filepathOrFile.getPath());
        }

        await fs.unlink(path.join(this.basePath, filepathOrFile));
    }

    public async list(
        dirPath: string,
        options: ListOptions = ListOptions.DEFAULT,
    ): Promise<string[]> {
        const fullPath = path.join(this.basePath, dirPath);
        let items = await fs.readdir(fullPath, { withFileTypes: true });

        if (!(options & ListOptions.INCLUDE_DOTFILES)) {
            items = items.filter((item) => !item.name.startsWith('.'));
        }

        if (!(options & ListOptions.INCLUDE_SYMLINKS)) {
            items = items.filter((item) => !item.isSymbolicLink());
        }

        const files = items
            .filter((item) => item.isFile())
            .map((item) => path.join(dirPath, item.name));

        const directories = items
            .filter((item) => item.isDirectory())
            .map((item) => path.join(dirPath, item.name));

        // If recursive option is set, list subdirectories as well
        if (options & ListOptions.RECURSIVE) {
            for (const directoryName of directories) {
                const subItems = await this.list(
                    path.join(dirPath, directoryName),
                    options,
                );
                files.push(...subItems);
            }
        }

        return files;
    }
}
