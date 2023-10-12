import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import { FileSystemFile, ListOptions } from '@versastore/core';
import path from 'path';

interface MemoryFileSystemInternalFile {
    file: FileSystemFile;
    meta: FileMetadata;
}

export class MemoryFileSystem implements FileSystemInterface {
    private files: Map<string, MemoryFileSystemInternalFile> = new Map<
        string,
        MemoryFileSystemInternalFile
    >();

    constructor(files: MemoryFileSystemInternalFile[] = []) {
        for (const { file, meta } of files) {
            this.writeSync(file, meta);
        }
    }

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const normalizedPath = this.normalize(filepath);

        const fileWithMeta = this.files.get(normalizedPath);

        if (!fileWithMeta) {
            throw new Error(`File ${normalizedPath} not found`);
        }

        return {
            ...fileWithMeta.meta,
            size: fileWithMeta.file.getContent().getByteLength(),
        };
    }

    public async has(filepath: string): Promise<boolean> {
        return this.files.has(this.normalize(filepath));
    }

    public async write(
        file: FileSystemFile,
        meta: FileMetadata = {},
    ): Promise<void> {
        this.writeSync(file, meta);
    }

    private writeSync(file: FileSystemFile, meta: FileMetadata = {}): void {
        const normalizedPath = this.normalize(file.getPath());

        this.files.set(normalizedPath, {
            file: new FileSystemFile(normalizedPath, file.getContent()),
            meta,
        });
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const normalizedPath = this.normalize(filepath);

        const fileWithMeta = this.files.get(normalizedPath);

        if (!fileWithMeta) {
            throw new Error(`File ${normalizedPath} not found`);
        }

        return fileWithMeta.file;
    }

    public async destroy(
        filepathOrFile: string | FileSystemFile,
    ): Promise<void> {
        if (!(typeof filepathOrFile === 'string')) {
            return this.destroy(filepathOrFile.getPath());
        }

        const normalizedPath = this.normalize(filepathOrFile);

        const fileList = await this.list(normalizedPath);

        if (!(await this.has(normalizedPath)) && fileList.length === 0) {
            throw new Error(`File ${normalizedPath} not found`);
        }

        this.files.delete(this.normalize(filepathOrFile));

        // Recursive deletion!
        for (const filePath of fileList) {
            this.files.delete(filePath);
        }
    }

    public async list(
        dirPath: string,
        options: ListOptions = ListOptions.DEFAULT,
    ): Promise<string[]> {
        let normalizedPath = this.normalize(dirPath);

        if (!normalizedPath.endsWith('/') && normalizedPath !== '/') {
            normalizedPath += '/';
        }

        let files = [...this.files.keys()].filter((filePath: string): boolean =>
            this.normalize(filePath).startsWith(normalizedPath),
        );

        if (!(options & ListOptions.INCLUDE_DOTFILES)) {
            files = files.filter(
                (filePath: string): boolean =>
                    !filePath
                        .split('/')
                        .some((particle) => particle.startsWith('.')),
            );
        }

        if (!(options & ListOptions.RECURSIVE)) {
            return files.filter(
                (filePath: string): boolean =>
                    filePath.split('/').length ===
                    normalizedPath.split('/').length,
            );
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
