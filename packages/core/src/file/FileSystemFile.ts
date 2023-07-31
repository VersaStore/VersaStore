import type { FileContentInterface } from './content/FileContentInterface.js';

export interface FileMetadata {
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
}

export class FileSystemFile {
    constructor(
        private readonly path: string,
        private readonly content: FileContentInterface,
        private readonly metadata: FileMetadata = {},
    ) {}

    public getPath(): string {
        return this.path;
    }

    public getMetadata(): FileMetadata {
        return {
            ...this.metadata,
            contentLength: this.content.getByteLength(),
        };
    }

    public getContent(): FileContentInterface {
        return this.content;
    }

    public hasContent(): boolean {
        return this.getContent().getContent().length > 0;
    }
}
