import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import {
    BufferFileContent,
    FileSystemFile,
    ListOptions,
} from '@versastore/core';
import type { Stats } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

export class LocalFileSystem implements FileSystemInterface {
    constructor(private readonly basePath: string) {}

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const normalizedPath = this.normalize(filepath);

        const stats = await fs
            .stat(path.join(this.basePath, normalizedPath))
            .catch(() => {
                throw this.createErrorNotFound(normalizedPath);
            });

        return {
            lastModified: stats.mtime,
            lastAccessed: stats.atime,
            created: stats.ctime,
            size: stats.size,
        };
    }

    public async has(filepath: string): Promise<boolean> {
        return fs
            .stat(path.join(this.basePath, this.normalize(filepath)))
            .then(() => true)
            .catch(() => false);
    }

    public async write(file: FileSystemFile): Promise<void> {
        const normalizedFilePath = this.normalize(file.getPath());
        const fullPath = path.join(this.basePath, normalizedFilePath);
        const baseDir = path.dirname(fullPath);

        await fs.mkdir(baseDir, { recursive: true });
        await fs.writeFile(fullPath, file.getContent().getContent());
    }

    protected async assertExists(filepath: string): Promise<void> {
        const hasFile = await this.has(filepath);

        if (hasFile) {
            return;
        }

        throw this.createErrorNotFound(filepath);
    }

    protected createErrorNotFound(filepath: string): Error {
        return new Error(`File ${this.normalize(filepath)} not found`);
    }

    protected async stat(filepath: string): Promise<Stats> {
        const normalizedPath = this.normalize(filepath);
        const fullPath = path.join(this.basePath, normalizedPath);

        return fs.stat(fullPath).catch(() => {
            throw this.createErrorNotFound(normalizedPath);
        });
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const normalizedPath = this.normalize(filepath);
        const fullPath = path.join(this.basePath, normalizedPath);

        await this.assertExists(normalizedPath);

        return new FileSystemFile(
            normalizedPath,
            new BufferFileContent(await fs.readFile(fullPath)),
        );
    }

    public async destroy(
        filepathOrFile: string | FileSystemFile,
    ): Promise<void> {
        if (!(typeof filepathOrFile === 'string')) {
            return this.destroy(filepathOrFile.getPath());
        }

        const normalizedPath = this.normalize(filepathOrFile);

        const stats = await this.stat(filepathOrFile);

        const fullPath = path.join(this.basePath, normalizedPath);

        if (stats.isFile() || stats.isSymbolicLink()) {
            return fs.unlink(fullPath);
        }

        if (stats.isDirectory()) {
            const files = await fs.readdir(fullPath);

            for (const file of files) {
                await this.destroy(path.join(normalizedPath, file));
            }

            await fs.rmdir(fullPath);
        }
    }

    public async list(
        dirPath: string,
        options: ListOptions = ListOptions.DEFAULT,
    ): Promise<string[]> {
        const normalizedDirPath = this.normalize(dirPath);
        const fullPath = path.join(this.basePath, normalizedDirPath);

        let items = await fs.readdir(fullPath, { withFileTypes: true });

        if (!(options & ListOptions.INCLUDE_DOTFILES)) {
            items = items.filter((item) => !item.name.startsWith('.'));
        }

        const files = items
            .filter((item) => item.isFile())
            .map((item) => path.join(normalizedDirPath, item.name));

        const directories = items
            .filter((item) => item.isDirectory())
            .map((item) => path.join(normalizedDirPath, item.name));

        // If recursive option is set, list subdirectories as well
        if (options & ListOptions.RECURSIVE) {
            for (const directory of directories) {
                const subItems = await this.list(directory, options);
                files.push(...subItems);
            }
        }

        return files;
    }

    private normalize(filepath: string): string {
        if (!filepath.startsWith('/')) {
            return this.normalize('/' + filepath);
        }

        return path.normalize(filepath);
    }
}
