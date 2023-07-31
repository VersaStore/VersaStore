import type { FileContentInterface } from './FileContentInterface.js';

export class StringFileContent implements FileContentInterface {
    public constructor(private content: string) {}

    public getContent(): Uint8Array | Buffer | string {
        return this.content;
    }

    public getContentAsString(): string {
        return this.content;
    }

    public getContentAsBuffer(): Buffer {
        return Buffer.from(this.content);
    }

    public getByteLength(): number {
        return Buffer.byteLength(this.content);
    }
}
