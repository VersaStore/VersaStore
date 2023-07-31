import type { FileSystemFile } from './file/FileSystemFile.js';

export interface FileSystemInterface {
    hasFile: (path: string) => Promise<boolean>;
    writeFile: (file: FileSystemFile) => Promise<void>;
    readFile: (path: string) => Promise<FileSystemFile>;
}
