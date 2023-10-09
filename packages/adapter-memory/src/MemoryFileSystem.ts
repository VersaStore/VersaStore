import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import { FileSystemFile, ListOptions } from '@versastore/core';
import path from 'path';

interface MemoryFileSystemInternalFile {
    file: FileSystemFile;
    meta: FileMetadata;
}

export class MemoryFileSystem implements FileSystemInterface {
    private files: MemoryFileSystemInternalFile[];

    constructor(files: MemoryFileSystemInternalFile[] = []) {
        this.files = files.map(({ file, meta }) => ({
            file: new FileSystemFile(
                this.normalize(file.getPath()),
                file.getContent(),
            ),
            meta,
        }));
    }

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const normalizedPath = this.normalize(filepath);

        const fileWithMeta = this.files.find(
            ({ file }): boolean =>
                this.normalize(file.getPath()) === normalizedPath,
        );

        if (!fileWithMeta) {
            throw new Error(`File ${normalizedPath} not found`);
        }

        return {
            ...fileWithMeta.meta,
            size: fileWithMeta.file.getContent().getByteLength(),
        };
    }

    public async has(filepath: string): Promise<boolean> {
        const normalizedPath = this.normalize(filepath);

        return (
            undefined !==
            this.files.find(
                ({ file }): boolean =>
                    this.normalize(file.getPath()) === normalizedPath,
            )
        );
    }

    public async write(
        file: FileSystemFile,
        meta: FileMetadata = {},
    ): Promise<void> {
        if (await this.has(file.getPath())) {
            await this.destroy(this.normalize(file.getPath()));
        }

        this.files.push({
            file: new FileSystemFile(
                this.normalize(file.getPath()),
                file.getContent(),
            ),
            meta,
        });
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const normalizedPath = this.normalize(filepath);

        const fileWithMeta = this.files.find(
            ({ file }): boolean =>
                this.normalize(file.getPath()) === normalizedPath,
        );

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

        await this.getMetadata(normalizedPath);

        this.files = this.files.filter(
            ({ file }): boolean =>
                this.normalize(file.getPath()) !== normalizedPath,
        );
    }

    public async list(
        dirPath: string,
        options: ListOptions = ListOptions.DEFAULT,
    ): Promise<string[]> {
        let normalizedPath = this.normalize(dirPath);

        if (!normalizedPath.endsWith('/') && normalizedPath !== '/') {
            normalizedPath += '/';
        }

        let files = this.files.filter(({ file }): boolean =>
            this.normalize(file.getPath()).startsWith(normalizedPath),
        );

        if (!(options & ListOptions.INCLUDE_DOTFILES)) {
            files = files.filter(
                ({ file }): boolean =>
                    !this.normalize(file.getPath())
                        .split('/')
                        .some((particle) => particle.startsWith('.')),
            );
        }

        if (!(options & ListOptions.RECURSIVE)) {
            files = files.filter(
                ({ file }): boolean =>
                    this.normalize(file.getPath()).split('/').length ===
                    normalizedPath.split('/').length,
            );
        }

        return files.map(({ file }): string => this.normalize(file.getPath()));
    }

    private normalize(filepath: string): string {
        if (!filepath.startsWith('/')) {
            return this.normalize('/' + filepath);
        }

        return path.normalize(filepath);
    }
}
