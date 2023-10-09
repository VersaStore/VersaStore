import type { FileMetadata, FileSystemInterface } from '@versastore/core';
import {
    FileSystemFile,
    ListOptions,
    StringFileContent,
} from '@versastore/core';
import { describe, expect, test } from 'vitest';
import { promises as fsP } from 'fs';
import path from 'path';

export type InitialState = { file: FileSystemFile; meta: FileMetadata }[];

const initialState: InitialState = [
    {
        file: new FileSystemFile(
            '/test.txt',
            new StringFileContent('Hello World'),
        ),
        meta: {
            contentType: 'text/plain',
        },
    },
    {
        file: new FileSystemFile(
            '/test2.txt',
            new StringFileContent('Hello World 2'),
        ),
        meta: {},
    },
    {
        file: new FileSystemFile(
            '/file/in/some/subdirectory.html',
            new StringFileContent('<h1>Hello World 3</h1>'),
        ),
        meta: {
            contentType: 'text/html',
        },
    },
    {
        file: new FileSystemFile('/.DS_Store', new StringFileContent('')),
        meta: {
            contentType: 'application/octet-stream',
        },
    },
    {
        file: new FileSystemFile(
            '/.hidden/Hello',
            new StringFileContent('world'),
        ),
        meta: {},
    },
    {
        file: new FileSystemFile(
            '/.hidden/.DS_Store',
            new StringFileContent('world'),
        ),
        meta: {
            contentType: 'application/octet-stream',
        },
    },

    {
        file: new FileSystemFile(
            '/sub/.dir/.DS_Store',
            new StringFileContent(''),
        ),
        meta: {},
    },
    {
        file: new FileSystemFile(
            '/sub/dir/.DS_Store',
            new StringFileContent(''),
        ),
        meta: {},
    },
];

export function FileSystemInterfaceTest<
    T extends FileSystemInterface,
    Y extends object,
>(
    name: string,
    createFS: (
        initialState: InitialState,
    ) => Promise<{ fs: T; lifetimeOpts: Y }>,
    tearDownFS: (fs: T, lifetimeOpts: Y) => Promise<void> = (): Promise<void> =>
        Promise.resolve(),
    opts: {
        checkContentType: boolean;
        hasLastAccessed: boolean;
        hasCreated: boolean;
    } = {
        checkContentType: true,
        hasLastAccessed: true,
        hasCreated: true,
    },
): void {
    describe(name, () => {
        function assertDateBetweenFsCreation(
            date: Date,
            fsStartedCreating: Date,
            fsCreated: Date,
        ): void {
            const timeCeiled = Math.ceil(date.getTime() / 1000);
            const timeFloored = Math.floor(date.getTime() / 1000);

            const fsCreatedTime = Math.ceil(fsCreated.getTime() / 1000);
            const fsStartedCreatingTime = Math.floor(
                fsStartedCreating.getTime() / 1000,
            );

            expect(timeFloored).toBeLessThanOrEqual(fsCreatedTime);
            expect(timeCeiled).toBeGreaterThanOrEqual(fsStartedCreatingTime);
        }

        function assertTimestampedMetadata(
            meta: FileMetadata,
            fsStartedCreating: Date,
            fsCreated: Date,
        ): void {
            expect(meta.lastModified).toBeInstanceOf(Date);
            assertDateBetweenFsCreation(
                meta.lastModified!,
                fsStartedCreating,
                fsCreated,
            );

            if (opts.hasCreated) {
                expect(meta.created).toBeInstanceOf(Date);
                assertDateBetweenFsCreation(
                    meta.created!,
                    fsStartedCreating,
                    fsCreated,
                );
            }

            if (opts.hasLastAccessed) {
                expect(meta.created).toBeInstanceOf(Date);
                assertDateBetweenFsCreation(
                    meta.lastAccessed!,
                    fsStartedCreating,
                    fsCreated,
                );
            }
        }

        async function setupFS(): Promise<{
            fs: T;
            lifetimeOpts: Y;
            fsCreated: Date;
            fsStartedCreating: Date;
        }> {
            const fsStartedCreating = new Date();

            const fsWithLifetimeOpts = await createFS(
                initialState.map((fileWithMeta) => {
                    const now = new Date();

                    fileWithMeta.meta.created = now;
                    fileWithMeta.meta.lastModified = now;
                    fileWithMeta.meta.lastAccessed = now;

                    return fileWithMeta;
                }),
            );

            return {
                ...fsWithLifetimeOpts,
                fsStartedCreating,
                fsCreated: new Date(),
            };
        }

        test('saving and reading', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await fs.write(
                new FileSystemFile(
                    'test123.txt',
                    new StringFileContent('Hello World'),
                ),
            );

            const fileAsSaved = await fs.read('test123.txt');

            expect(fileAsSaved.getPath()).toBe('/test123.txt');
            expect(fileAsSaved.hasContent()).toBe(true);
            expect(fileAsSaved.getContent().getContentAsString()).toBe(
                'Hello World',
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('reading when file does not exist', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(async () => fs.read('some.path')).rejects.toThrow(
                new Error(`File /some.path not found`),
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('listing files', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            const files = await fs.list('/');

            expect(files.sort()).toEqual(
                ['/test.txt', '/test2.txt', '/.DS_Store'].sort(),
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('listing files recursively', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            const files = await fs.list('/', ListOptions.RECURSIVE);

            expect(files.sort()).toEqual(
                [
                    '/test.txt',
                    '/test2.txt',
                    '/file/in/some/subdirectory.html',
                ].sort(),
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('listing files recursively but not starting with trailing slash', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            const files = await fs.list('file/in', ListOptions.RECURSIVE);

            expect(files).toEqual(['/file/in/some/subdirectory.html']);

            await tearDownFS(fs, lifetimeOpts);
        });

        test('listing files recursively allowing dot-files', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            const files = await fs.list(
                '/',
                ListOptions.RECURSIVE | ListOptions.INCLUDE_DOTFILES,
            );

            expect(files.sort()).toEqual(
                [
                    '/test.txt',
                    '/test2.txt',
                    '/file/in/some/subdirectory.html',
                    '/.DS_Store',
                    '/.hidden/Hello',
                    '/.hidden/.DS_Store',
                    '/sub/.dir/.DS_Store',
                    '/sub/dir/.DS_Store',
                ].sort(),
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('getMetadata on /.hidden/.DS_Store', async () => {
            const { fs, lifetimeOpts, fsStartedCreating, fsCreated } =
                await setupFS();

            const meta = await fs.getMetadata('/.hidden/.DS_Store');

            expect(meta.size).toEqual(5);

            assertTimestampedMetadata(meta, fsStartedCreating, fsCreated);

            const expectedMetaKeys = ['size', 'lastModified'];

            if (opts.checkContentType) {
                expect(meta.contentType).toEqual('application/octet-stream');
                expectedMetaKeys.push('contentType');
            }

            if (opts.hasLastAccessed) {
                expectedMetaKeys.push('lastAccessed');
            }

            if (opts.hasCreated) {
                expectedMetaKeys.push('created');
            }

            expect(Object.keys(meta).sort()).toEqual(expectedMetaKeys.sort());

            await tearDownFS(fs, lifetimeOpts);
        });

        test('getMetadata on /file/in/some/subdirectory.html', async () => {
            const { fs, lifetimeOpts, fsStartedCreating, fsCreated } =
                await setupFS();

            const meta = await fs.getMetadata(
                '/file/in/some/subdirectory.html',
            );

            expect(meta.size).toEqual(22);

            assertTimestampedMetadata(meta, fsStartedCreating, fsCreated);

            const expectedMetaKeys = ['size', 'lastModified'];

            if (opts.checkContentType) {
                expectedMetaKeys.push('contentType');

                expect(meta.contentType).toEqual('text/html');
            }

            if (opts.hasLastAccessed) {
                expectedMetaKeys.push('lastAccessed');
            }

            if (opts.hasCreated) {
                expectedMetaKeys.push('created');
            }

            expect(Object.keys(meta).sort()).toEqual(expectedMetaKeys.sort());

            await tearDownFS(fs, lifetimeOpts);
        });

        test('getMetadata on non-existing file /does/not/exist', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(fs.getMetadata('/does/not/exist')).rejects.toThrow(
                new Error(`File /does/not/exist not found`),
            );

            await tearDownFS(fs, lifetimeOpts);
        });

        test('has on non-existing file', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(fs.has('/does/not/exist')).resolves.toBe(false);

            await tearDownFS(fs, lifetimeOpts);
        });

        test('has on existing file', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(fs.has('/test.txt')).resolves.toBe(true);

            await tearDownFS(fs, lifetimeOpts);
        });

        test('destroy using path', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(fs.has('/test.txt')).resolves.toBe(true);

            await fs.destroy('test.txt');

            await expect(fs.has('/test.txt')).resolves.toBe(false);

            await tearDownFS(fs, lifetimeOpts);
        });

        test('destroy using file', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            const file = await fs.read('/test.txt');

            await expect(fs.has('/test.txt')).resolves.toBe(true);

            await fs.destroy(file);

            await expect(fs.has('/test.txt')).resolves.toBe(false);

            await tearDownFS(fs, lifetimeOpts);
        });

        test('destroy non-existing file: /does/not/exist', async () => {
            const { fs, lifetimeOpts } = await setupFS();

            await expect(fs.destroy('/does/not/exist')).rejects.toThrow(
                new Error(`File /does/not/exist not found`),
            );

            await tearDownFS(fs, lifetimeOpts);
        });
    });
}

export async function deleteDirectoryRecursive(
    directoryPath: string,
): Promise<void> {
    if (await fsP.stat(directoryPath).catch(() => null)) {
        for (const file of await fsP.readdir(directoryPath)) {
            const curPath = path.join(directoryPath, file);

            const stat = await fsP.stat(curPath).catch(() => null);

            if (stat && stat.isDirectory()) {
                await deleteDirectoryRecursive(curPath);
            }

            if (stat && stat.isFile()) {
                await fsP.unlink(curPath);
            }
        }
        // Remove the directory itself
        await fsP.rmdir(directoryPath);
    }
}
