import { describe, expect, test } from 'vitest';
import { StringFileContent } from '../../../src';

describe(StringFileContent.name, () => {
    test('constructing and getters', () => {
        const sfc = new StringFileContent('some string');

        expect(sfc.getContentAsString()).toBe('some string');
        expect(sfc.getContentAsBuffer()).toStrictEqual(
            Buffer.from('some string'),
        );
        expect(sfc.getContent()).toBe('some string');
        expect(sfc.getByteLength()).toBe(11);
    });
});
