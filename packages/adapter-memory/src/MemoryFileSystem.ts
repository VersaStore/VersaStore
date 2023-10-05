import type {
    FileMetadata,
    FileSystemInterface,
    FileSystemFile,
} from '@versastore/core';

export class MemoryFileSystem implements FileSystemInterface {
    constructor(
        private files: { file: FileSystemFile; meta: FileMetadata }[] = [],
    ) {}

    public async getMetadata(path: string): Promise<FileMetadata> {
        return (
            this.files.find(({ file }): boolean => file.getPath() === path)
                ?.meta ?? {}
        );
    }

    public async has(path: string): Promise<boolean> {
        return (
            undefined !==
            this.files.find(({ file }): boolean => file.getPath() === path)
        );
    }

    public async write(
        file: FileSystemFile,
        meta: FileMetadata = {},
    ): Promise<void> {
        await this.destroy(file.getPath());
        this.files.push({ file, meta });
    }

    public async read(path: string): Promise<FileSystemFile> {
        const fileWithMeta = this.files.find(
            ({ file }): boolean => file.getPath() === path,
        );

        if (!fileWithMeta) {
            throw new Error(`File ${path} not found`);
        }

        return fileWithMeta.file;
    }

    public async destroy(path: string | FileSystemFile): Promise<void> {
        this.files = this.files.filter(
            ({ file }): boolean => file.getPath() !== path,
        );
    }
}
