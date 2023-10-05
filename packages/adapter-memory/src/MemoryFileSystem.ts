import type {
    FileMetadata,
    FileSystemFile,
    FileSystemInterface,
} from '@versastore/core';
import path from 'path';
import { ListOptions } from '@versastore/core';

export class MemoryFileSystem implements FileSystemInterface {
    constructor(
        private files: { file: FileSystemFile; meta: FileMetadata }[] = [],
    ) {}

    public async getMetadata(filepath: string): Promise<FileMetadata> {
        const normalizedPath = this.normalize(filepath);

        return (
            this.files.find(
                ({ file }): boolean =>
                    this.normalize(file.getPath()) === normalizedPath,
            )?.meta ?? {}
        );
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
        await this.destroy(this.normalize(file.getPath()));
        this.files.push({ file, meta });
    }

    public async read(filepath: string): Promise<FileSystemFile> {
        const normalizedPath = this.normalize(filepath);

        const fileWithMeta = this.files.find(
            ({ file }): boolean =>
                this.normalize(file.getPath()) === normalizedPath,
        );

        if (!fileWithMeta) {
            throw new Error(`File ${filepath} not found`);
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

        if (normalizedPath.endsWith('/')) {
            normalizedPath = normalizedPath.slice(0, -1);
        }

        let files = this.files.filter(({ file }): boolean =>
            this.normalize(file.getPath()).startsWith(normalizedPath + '/'),
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
                    normalizedPath ===
                    path.dirname(this.normalize(file.getPath())),
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
