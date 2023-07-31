import type { FileContentInterface } from './FileContentInterface.js';

export class BufferFileContent implements FileContentInterface {
    public constructor(private content: Buffer) {}

    public getContent(): Uint8Array | Buffer | string {
        return this.content;
    }

    public getContentAsString(): string {
        return this.content.toString();
    }

    public getContentAsBuffer(): Buffer {
        return this.content;
    }

    public getByteLength(): number {
        return this.content.length;
    }
}
