import type { FileSystemFile } from './file/FileSystemFile.js';
import type { FileMetadata } from './file/FileMetadata';

export interface FileSystemInterface {
    has: (path: string) => Promise<boolean>;
    write: (file: FileSystemFile, meta?: FileMetadata) => Promise<void>;
    read: (path: string) => Promise<FileSystemFile>;
    destroy: (path: string | FileSystemFile) => Promise<void>;
    getMetadata: (path: string) => Promise<FileMetadata>;
}
