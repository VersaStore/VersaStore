import type { FileSystemFile } from './file/FileSystemFile.js';
import type { FileMetadata } from './file/FileMetadata.js';
import type { ListOptions } from './ListOptions.js';

export interface FileSystemInterface {
    list: (dirPath: string, options?: ListOptions) => Promise<string[]>;

    has: (filepath: string) => Promise<boolean>;

    write: (file: FileSystemFile, meta?: FileMetadata) => Promise<void>;

    read: (filepath: string) => Promise<FileSystemFile>;

    destroy: (filepathOrFile: string | FileSystemFile) => Promise<void>;

    getMetadata: (filepath: string) => Promise<FileMetadata>;
}
