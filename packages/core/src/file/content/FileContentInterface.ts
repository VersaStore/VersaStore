export interface FileContentInterface {
    getContent: () => Uint8Array | Buffer | string;
    getContentAsString: () => string;
    getContentAsBuffer: () => Buffer;
    getByteLength: () => number;
}
