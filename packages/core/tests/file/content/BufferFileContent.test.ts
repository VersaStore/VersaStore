import { describe, expect, test } from 'vitest';
import { BufferFileContent } from '../../../src';

describe(BufferFileContent.name, () => {
    test('constructing and getters', () => {
        const buffer = Buffer.from('Some string');
        const bfc = new BufferFileContent(buffer);

        expect(bfc.getContentAsString()).toBe('Some string');
        expect(bfc.getContentAsBuffer()).toBe(buffer);
        expect(bfc.getContent()).toBe(buffer);
        expect(bfc.getByteLength()).toBe(11);
    });
});
