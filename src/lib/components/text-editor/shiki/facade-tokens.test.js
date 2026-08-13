/* eslint-disable jsdoc/require-jsdoc */

import { CodeHighlightNode, CodeNode, $createCodeNode as createCodeNode } from '@lexical/code-core';
import { createEditor, $getRoot as getRoot } from 'lexical';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tokenizing builds Lexical nodes, so these run against a real editor rather than a mocked one.
 */

const engineState = vi.hoisted(() => ({
  /** @type {any[][]} */ tokens: [],
}));

vi.mock('./cache.js', () => ({
  getCachedPayload: vi.fn(async () => undefined),
  cachePayload: vi.fn(async () => undefined),
}));

vi.mock('./loader.js', () => ({
  getCodeHighlighterLoaders: () => ({
    loadEngine: async () => ({
      createJavaScriptRegexEngine: () => ({}),
      createHighlighterCoreSync: () => ({
        getLoadedLanguages: () => ['javascript'],
        getLoadedThemes: () => ['github-light'],
        loadLanguage: async () => undefined,
        loadTheme: async () => undefined,
        codeToTokens: () => ({ tokens: engineState.tokens }),
      }),
      isSpecialLang: () => false,
      isSpecialTheme: () => false,
      stringifyTokenStyle: (/** @type {any} */ style) =>
        Object.entries(style ?? {})
          .map(([key, value]) => `${key}:${value}`)
          .join(';'),
      getTokenStyleObject: (/** @type {any} */ token) => ({ color: token.color }),
    }),
    loadLanguage: async () => undefined,
    loadTheme: async () => undefined,
  }),
  setCodeHighlighterLoaders: vi.fn(),
}));

// eslint-disable-next-line import/first
import { getHighlightNodes, loadEngine } from './facade.js';

/**
 * Tokenize the given text through the facade, inside an editor context.
 * @param {string} text Code content.
 * @param {any[][]} tokens Tokens the fake engine should return.
 * @param {string} [language] Language identifier.
 * @returns {any[]} Description of each produced node.
 */
const tokenize = (text, tokens, language = 'javascript') => {
  engineState.tokens = tokens;

  const editor = createEditor({
    nodes: [CodeNode, CodeHighlightNode],
    onError: (error) => {
      throw error;
    },
  });

  /** @type {any[]} */
  let result = [];

  editor.update(
    () => {
      const code = createCodeNode();

      code.setLanguage(language);
      code.setTheme('github-light');
      getRoot().append(code);

      result = getHighlightNodes(
        /** @type {any} */ ({
          getTextContent: () => text,
          getTheme: () => 'github-light',
        }),
        language,
      ).map((node) => ({
        type: node.getType(),
        text: node.getTextContent(),
        style: /** @type {any} */ (node).getStyle?.(),
        highlightType: /** @type {any} */ (node).__highlightType,
      }));
    },
    { discrete: true },
  );

  return result;
};

describe('facade tokenizing', () => {
  beforeEach(async () => {
    await loadEngine();
  });

  it('turns tokens into styled highlight nodes', () => {
    const nodes = tokenize('const a', [
      [
        { content: 'const', color: '#f00' },
        { content: ' a', color: '#0f0' },
      ],
    ]);

    expect(nodes).toEqual([
      { type: 'code-highlight', text: 'const', style: 'color:#f00', highlightType: undefined },
      { type: 'code-highlight', text: ' a', style: 'color:#0f0', highlightType: undefined },
    ]);
  });

  it('separates lines with line break nodes', () => {
    const nodes = tokenize('a\nb', [
      [{ content: 'a', color: '#f00' }],
      [{ content: 'b', color: '#f00' }],
    ]);

    expect(nodes.map((node) => node.type)).toEqual([
      'code-highlight',
      'linebreak',
      'code-highlight',
    ]);
  });

  it('splits line breaks and tabs inside a token', () => {
    const nodes = tokenize('a\n\tb', [[{ content: 'a\n\tb', color: '#f00' }]]);

    expect(nodes.map((node) => node.type)).toEqual([
      'code-highlight',
      'linebreak',
      'tab',
      'code-highlight',
    ]);
  });

  it('prefers a token’s own inline style over the derived one', () => {
    const nodes = tokenize('a', [[{ content: 'a', color: '#f00', htmlStyle: { color: '#00f' } }]]);

    expect(nodes[0].style).toBe('color:#00f');
  });

  it('marks added and removed lines of a diff language', () => {
    const nodes = tokenize(
      '+a\n-b',
      [[{ content: '+a', color: '#f00' }], [{ content: '-b', color: '#f00' }]],
      'diff-javascript',
    );

    expect(nodes.map((node) => [node.text, node.highlightType])).toEqual([
      ['+', 'inserted'],
      ['a', undefined],
      ['\n', undefined],
      ['-', 'deleted'],
      ['b', undefined],
    ]);
  });

  it('leaves an unchanged diff line unprefixed', () => {
    const nodes = tokenize(' a', [[{ content: ' a', color: '#f00' }]], 'diff-javascript');

    expect(nodes.map((node) => [node.text, node.highlightType])).toEqual([
      [' ', 'unchanged'],
      ['a', undefined],
    ]);
  });

  it('ignores a diff prefix that is not a diff marker', () => {
    const nodes = tokenize('xa', [[{ content: 'xa', color: '#f00' }]], 'diff-javascript');

    expect(nodes.map((node) => node.text)).toEqual(['xa']);
  });

  it('produces nothing for empty content', () => {
    expect(tokenize('', [[]])).toEqual([]);
  });
});
