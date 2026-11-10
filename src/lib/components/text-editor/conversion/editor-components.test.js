/* eslint-disable import/first */

import { describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({
  /**
   * Get the shared mock of the given module.
   * @param {string} id Module ID.
   * @returns {Promise<any>} Mocked module exports.
   */
  getMock: async (id) => (await import('#lib/test-utils/editor-mocks.js')).editorMocks[id],
}));

vi.mock('@sveltia/utils/misc', () => getMock('@sveltia/utils/misc'));
vi.mock('@sveltia/utils/events', () => getMock('@sveltia/utils/events'));
vi.mock('@sveltia/utils/string', () => getMock('@sveltia/utils/string'));
vi.mock('@lexical/code-core', () => getMock('@lexical/code-core'));
vi.mock('../shiki/highlighter.js', () => getMock('./shiki/highlighter.js'));
vi.mock('../shiki/facade.js', () => getMock('./shiki/facade.js'));
vi.mock('../shiki/theme.js', () => getMock('./shiki/theme.js'));
vi.mock('@lexical/dragon', () => getMock('@lexical/dragon'));
vi.mock('@lexical/extension', () => getMock('@lexical/extension'));
vi.mock('@lexical/html', () => getMock('@lexical/html'));
vi.mock('../editing/alignment.js', () => getMock('./editing/alignment.js'));
vi.mock('../editing/table.js', () => getMock('./editing/table.js'));
vi.mock('./html.js', () => getMock('./conversion/html.js'));
vi.mock('@lexical/history', () => getMock('@lexical/history'));
vi.mock('@lexical/link', () => getMock('@lexical/link'));
vi.mock('@lexical/list', () => getMock('@lexical/list'));
vi.mock('@lexical/markdown', () => getMock('@lexical/markdown'));
vi.mock('@lexical/rich-text', () => getMock('@lexical/rich-text'));
vi.mock('@lexical/table', () => getMock('@lexical/table'));
vi.mock('@lexical/utils', () => getMock('@lexical/utils'));
vi.mock('lexical', () => getMock('lexical'));

import { removePlaceholdersFromMatch } from './editor-components.js';

describe('removePlaceholdersFromMatch', () => {
  it('matches a text match component after the placeholder of an HTML block line', () => {
    const replace = vi.fn();

    const transformer = /** @type {any} */ (
      removePlaceholdersFromMatch(
        /** @type {any} */ ({
          type: 'text-match',
          importRegExp: /^<aside>(?<text>.*)<\/aside>$/,
          regExp: /(?!)/,
          replace,
        }),
      )
    );

    const match = '\uE007<aside>“\uE003._a_.\uE003”</aside>'.match(transformer.importRegExp);

    expect(match?.index).toBe(1);
    expect(match?.[0]).toBe('<aside>“\uE003._a_.\uE003”</aside>');
    expect('<i>'.match(transformer.importRegExp)).toBeNull();
    expect(transformer.importRegExp.source).toBe('^<aside>(?<text>.*)<\\/aside>$');

    transformer.replace('node', match);
    expect(replace).toHaveBeenCalledWith('node', expect.anything());

    const [[, cleaned]] = replace.mock.calls;

    expect([...cleaned]).toEqual(['<aside>“_a_”</aside>', '“_a_”']);
    expect(cleaned.groups).toEqual({ text: '“_a_”' });
    expect(cleaned.index).toBe(1);

    transformer.replace('node', Object.assign(['a', undefined], { index: 0 }));
    expect([...replace.mock.calls[1][1]]).toEqual(['a', undefined]);
  });

  it('gives a multiline component the lines without the placeholders', () => {
    const handleImportAfterStartMatch = vi.fn(() => null);

    const transformer = /** @type {any} */ (
      removePlaceholdersFromMatch(
        /** @type {any} */ ({ type: 'multiline-element', handleImportAfterStartMatch }),
      )
    );

    transformer.handleImportAfterStartMatch({ lines: ['\uE007<aside>', 'a\t'], startLineIndex: 0 });
    expect(handleImportAfterStartMatch).toHaveBeenCalledWith({
      lines: ['<aside>', 'a\t'],
      startLineIndex: 0,
    });
  });

  it('matches an element component at the start of an HTML block line', () => {
    const replace = vi.fn();

    const transformer = /** @type {any} */ (
      removePlaceholdersFromMatch(
        /** @type {any} */ ({ type: 'element', regExp: /^<video src="(.*)">/, replace }),
      )
    );

    const match = '\uE007<video src="a\uE005b">x'.match(transformer.regExp);

    // Lexical removes the match from the start of the line by its length
    expect(match?.[0]).toBe('\uE007<video src="a\uE005b">');
    expect(match?.index).toBe(0);
    expect('<video src="c">'.match(transformer.regExp)?.[0]).toBe('<video src="c">');
    expect('a\uE007<video src="c">'.match(transformer.regExp)).toBeNull();

    const children = [{ type: 'text' }];

    transformer.replace('parent', children, match, true);
    expect(replace.mock.calls[0][1]).toBe(children);
    expect([...replace.mock.calls[0][2]]).toEqual(['<video src="a\tb">', 'a\tb']);
  });

  it('matches a multiline component at the start and the end of HTML block lines', () => {
    const replace = vi.fn();

    const transformer = /** @type {any} */ (
      removePlaceholdersFromMatch(
        /** @type {any} */ ({
          type: 'multiline-element',
          regExpStart: /^<aside>/,
          regExpEnd: { optional: true, regExp: /<\/aside>$/ },
          replace,
        }),
      )
    );

    expect('\uE007<aside>'.match(transformer.regExpStart)?.[0]).toBe('\uE007<aside>');
    expect('\uE007</aside>'.match(transformer.regExpEnd.regExp)?.[0]).toBe('\uE007</aside>');
    expect('a\uE003.</aside>'.match(transformer.regExpEnd.regExp)?.index).toBe(3);
    expect(transformer.regExpEnd.optional).toBe(true);

    transformer.replace('root', null, null, null, ['a\uE005b', '\uE007c'], true);
    expect(replace).toHaveBeenCalledWith('root', null, null, null, ['a\tb', 'c'], true);

    const plainEnd = /** @type {any} */ (
      removePlaceholdersFromMatch(
        /** @type {any} */ ({ type: 'multiline-element', regExpStart: /^a/, regExpEnd: /b$/ }),
      )
    );

    expect('\uE007ab'.match(plainEnd.regExpEnd)?.index).toBe(2);
  });

  it('leaves a transformer without an import alone', () => {
    const multiline = /** @type {any} */ ({ type: 'multiline-element' });
    const textMatch = /** @type {any} */ ({ type: 'text-match', regExp: /x/ });

    expect(removePlaceholdersFromMatch(multiline)).toEqual(multiline);
    expect(removePlaceholdersFromMatch(textMatch)).toEqual(textMatch);
  });
});
