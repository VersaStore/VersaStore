import type { FileContentInterface } from './FileContentInterface.js';

export class Uint8ArrayFileContent implements FileContentInterface {
    public constructor(private content: Uint8Array) {}

    public getContent(): Uint8Array | Buffer | string {
        return this.content;
    }

    public getContentAsString(): string {
        return this.getContentAsBuffer().toString();
    }

    public getContentAsBuffer(): Buffer {
        return Buffer.from(this.content);
    }

    public getByteLength(): number {
        return this.content.length;
    }
}
