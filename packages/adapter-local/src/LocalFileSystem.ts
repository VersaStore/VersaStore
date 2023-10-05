import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import { BufferFileContent, FileSystemFile } from '@versastore/core';
import { promises as fs } from 'fs';

export class LocalFileSystem implements FileSystemInterface {
    public async getMetadata(path: string): Promise<FileMetadata> {
        const stats = await fs.stat(path);

        return {
            lastModified: stats.mtime,
            lastAccessed: stats.atime,
            created: stats.ctime,
            size: stats.size,
        };
    }

    public async has(path: string): Promise<boolean> {
        return fs
            .stat(path)
            .then(() => true)
            .catch(() => false);
    }

    public async write(file: FileSystemFile): Promise<void> {
        await fs.writeFile(file.getPath(), file.getContent().getContent());
    }

    public async read(path: string): Promise<FileSystemFile> {
        return new FileSystemFile(
            path,
            new BufferFileContent(await fs.readFile(path)),
        );
    }

    public async destroy(path: string | FileSystemFile): Promise<void> {
        if (!(typeof path === 'string')) {
            return this.destroy(path.getPath());
        }

        await fs.unlink(path);
    }
}
