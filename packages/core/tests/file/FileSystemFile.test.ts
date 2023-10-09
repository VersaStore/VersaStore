import { describe, expect, test } from 'vitest';
import type { FileContentInterface } from '../../src';
import { FileSystemFile } from '../../src';

describe(FileSystemFile.name, () => {
    test('constructing and getters', () => {
        const content: FileContentInterface = {
            getContentAsString: (): string => 'Some string',
            getContent: (): Buffer => Buffer.from('Some string'),
            getContentAsBuffer: (): Buffer => Buffer.from('Some string'),
            getByteLength: (): number => 123,
        };

        const file = new FileSystemFile('some.path', content);

        expect(file.getPath()).toBe('some.path');
        expect(file.hasContent()).toBe(true);
        expect(file.getContent()).toBe(content);
    });

    test('constructing and getters on empty file', () => {
        const content: FileContentInterface = {
            getContentAsString: (): string => '',
            getContentAsBuffer: (): Buffer => Buffer.from([]),
            getByteLength: (): number => 0,
            getContent: (): string => '',
        };

        const file = new FileSystemFile('some.path', content);

        expect(file.getPath()).toBe('some.path');
        expect(file.hasContent()).toBe(false);
        expect(file.getContent()).toBe(content);
    });
});
