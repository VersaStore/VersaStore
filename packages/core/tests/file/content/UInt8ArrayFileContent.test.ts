import { describe, expect, test } from 'vitest';
import { Uint8ArrayFileContent } from '../../../src';

describe(Uint8ArrayFileContent.name, () => {
    test('constructing and getters', () => {
        const buffer = Buffer.from('some string');
        const afc = new Uint8ArrayFileContent(buffer);

        expect(afc.getContentAsString()).toBe('some string');
        expect(afc.getContentAsBuffer()).toStrictEqual(
            Buffer.from('some string'),
        );
        expect(afc.getContent()).toStrictEqual(buffer);
        expect(afc.getByteLength()).toBe(11);
    });
});
