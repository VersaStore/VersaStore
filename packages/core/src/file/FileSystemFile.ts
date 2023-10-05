import type { FileContentInterface } from './content/FileContentInterface.js';

export class FileSystemFile {
    constructor(
        private readonly path: string,
        private readonly content: FileContentInterface,
    ) {}

    public getPath(): string {
        return this.path;
    }

    public getContent(): FileContentInterface {
        return this.content;
    }

    public hasContent(): boolean {
        return this.getContent().getContent().length > 0;
    }
}
