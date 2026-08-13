/* eslint-disable jsdoc/require-jsdoc */

import { CodeHighlightNode, CodeNode, $createCodeNode as createCodeNode } from '@lexical/code-core';
import {
  $createLineBreakNode as createLineBreakNode,
  createEditor,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  ParagraphNode,
} from 'lexical';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const facadeState = vi.hoisted(() => ({
  engineLoaded: true,
  engineUnavailable: false,
  /** @type {Set<string>} */ languages: new Set(['javascript']),
  /** @type {Set<string>} */ themes: new Set(['github-light']),
}));

vi.mock('./facade.js', async () => {
  const { $createCodeHighlightNode: createCodeHighlightNode } = await import('@lexical/code-core');

  return {
    isEngineLoaded: vi.fn(() => facadeState.engineLoaded),
    isEngineUnavailable: vi.fn(() => facadeState.engineUnavailable),
    isPlainLanguage: vi.fn((language) =>
      ['', 'plain', 'plaintext', 'text', 'txt'].includes(language ?? ''),
    ),
    isCodeLanguageLoaded: vi.fn((language) => facadeState.languages.has(language)),
    isCodeThemeLoaded: vi.fn((theme) => facadeState.themes.has(theme)),
    loadEngine: vi.fn(),
    loadCodeLanguage: vi.fn(),
    loadCodeTheme: vi.fn(),
    // Stand in for Shiki: one highlight node per whitespace-separated word
    getHighlightNodes: vi.fn((codeNode) =>
      codeNode
        .getTextContent()
        .split(/(\s+)/)
        .filter(Boolean)
        .map((/** @type {any} */ part) => {
          const node = createCodeHighlightNode(part);

          node.setStyle('color: #f00');

          return node;
        }),
    ),
  };
});

// eslint-disable-next-line import/first
import {
  getHighlightNodes,
  isCodeLanguageLoaded,
  loadCodeLanguage,
  loadCodeTheme,
  loadEngine,
} from './facade.js';
// eslint-disable-next-line import/first
import { registerCodeHighlighting, shikiTokenizer } from './highlighter.js';

/**
 * Build an editor with the code nodes registered.
 * @returns {any} Editor instance.
 */
const createTestEditor = () =>
  createEditor({
    nodes: [CodeNode, CodeHighlightNode],
    onError: (error) => {
      throw error;
    },
  });

/**
 * Tokenizer that splits on whitespace, so assertions do not depend on Shiki.
 * @returns {any} Tokenizer.
 */
const createTestTokenizer = () => ({
  defaultLanguage: 'plain',
  defaultTheme: 'github-light',
  tokenize: vi.fn((codeNode) =>
    getHighlightNodes(codeNode, 'javascript').flatMap((node) =>
      node.getTextContent() === '\n' ? [createLineBreakNode()] : [node],
    ),
  ),
});

/**
 * Get the first block in the editor. Cast, since the root's children are plain `LexicalNode`s.
 * @returns {any} Node.
 */
const firstBlock = () => /** @type {any} */ (getRoot().getChildren()[0]);

/**
 * Insert a code block carrying the given text.
 * @param {any} editor Editor instance.
 * @param {string} text Code content.
 * @param {object} [options] Options.
 * @param {string | null} [options.language] Language to assign, or `null` to leave unset.
 * @param {string | null} [options.theme] Theme to assign, or `null` to leave unset.
 */
const insertCodeBlock = (editor, text, { language = 'javascript', theme = null } = {}) => {
  editor.update(
    () => {
      const code = createCodeNode();

      if (language) {
        code.setLanguage(language);
      }

      if (theme) {
        code.setTheme(theme);
      }

      code.append(createTextNode(text));
      getRoot().clear();
      getRoot().append(code);
    },
    { discrete: true },
  );
};

/**
 * Read the first code block’s state.
 * @param {any} editor Editor instance.
 * @returns {any} Summary of the block.
 */
const readCodeBlock = (editor) => {
  let result;

  editor.read(() => {
    const node = firstBlock();

    result = {
      text: node.getTextContent(),
      language: node.getLanguage?.(),
      theme: node.getTheme?.(),
      supported: node.getIsSyntaxHighlightSupported?.(),
      childTypes: node.getChildren?.().map((/** @type {any} */ child) => child.getType()),
      styles: node.getChildren?.().map((/** @type {any} */ child) => child.getStyle?.()),
    };
  });

  return result;
};

describe('shiki highlighter', () => {
  beforeEach(() => {
    facadeState.engineLoaded = true;
    facadeState.engineUnavailable = false;
    facadeState.languages = new Set(['javascript']);
    facadeState.themes = new Set(['github-light']);
    vi.clearAllMocks();
  });

  it('refuses to register without the code nodes', () => {
    const editor = createEditor({
      onError: (error) => {
        throw error;
      },
    });

    expect(() => registerCodeHighlighting(editor, createTestTokenizer())).toThrow(
      'CodeNode or CodeHighlightNode not registered on editor',
    );
  });

  it('replaces the block’s text with highlight nodes', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    const block = readCodeBlock(editor);

    expect(block.text).toBe('const a');
    expect(block.childTypes).toEqual(['code-highlight', 'code-highlight', 'code-highlight']);
    expect(block.styles.every((/** @type {any} */ style) => style === 'color: #f00')).toBe(true);
    expect(block.supported).toBe(true);
  });

  it('assigns the tokenizer’s default language and theme when the block has none', () => {
    const editor = createTestEditor();
    const tokenizer = { ...createTestTokenizer(), defaultLanguage: 'javascript' };

    registerCodeHighlighting(editor, tokenizer);
    insertCodeBlock(editor, 'const a', { language: null });

    const block = readCodeBlock(editor);

    expect(block.language).toBe('javascript');
    expect(block.theme).toBe('github-light');
  });

  it('leaves a plain language unhighlighted without calling the tokenizer’s Shiki path', () => {
    const editor = createTestEditor();
    const tokenizer = createTestTokenizer();

    registerCodeHighlighting(editor, tokenizer);
    insertCodeBlock(editor, 'const a', { language: 'plain' });

    const block = readCodeBlock(editor);

    // Whether the content is styled is up to the tokenizer; what matters here is that the transform
    // asks for nothing over the network
    expect(block.supported).toBe(false);
    expect(loadEngine).not.toHaveBeenCalled();
    expect(loadCodeLanguage).not.toHaveBeenCalled();
    expect(loadCodeTheme).not.toHaveBeenCalled();
  });

  it('requests the engine and holds off highlighting until it arrives', () => {
    facadeState.engineLoaded = false;

    const editor = createTestEditor();
    const tokenizer = createTestTokenizer();

    registerCodeHighlighting(editor, tokenizer);
    insertCodeBlock(editor, 'const a');

    expect(loadEngine).toHaveBeenCalled();
    expect(tokenizer.tokenize).not.toHaveBeenCalled();
    // The content is still a plain text node, so nothing is lost while waiting
    expect(readCodeBlock(editor).childTypes).toEqual(['text']);
  });

  it('highlights once the engine becomes available', () => {
    facadeState.engineLoaded = false;

    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    facadeState.engineLoaded = true;

    editor.update(
      () => {
        firstBlock().markDirty();
      },
      { discrete: true },
    );

    expect(readCodeBlock(editor).childTypes).toEqual([
      'code-highlight',
      'code-highlight',
      'code-highlight',
    ]);
  });

  it('requests a grammar that is not loaded', () => {
    facadeState.languages = new Set();

    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    expect(loadCodeLanguage).toHaveBeenCalledWith(
      'javascript',
      expect.anything(),
      expect.any(String),
    );
  });

  it('requests a theme that is not loaded', () => {
    facadeState.themes = new Set();

    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    expect(loadCodeTheme).toHaveBeenCalledWith(
      'github-light',
      expect.anything(),
      expect.any(String),
    );
  });

  it('marks an unsupported language as not highlighted', () => {
    facadeState.languages = new Set();
    vi.mocked(loadCodeLanguage).mockReturnValue(undefined);

    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    expect(readCodeBlock(editor).supported).toBe(false);
  });

  it('falls back to plain text when the engine could not be fetched', () => {
    facadeState.engineLoaded = false;
    facadeState.engineUnavailable = true;

    const editor = createTestEditor();
    const tokenizer = createTestTokenizer();

    registerCodeHighlighting(editor, tokenizer);
    insertCodeBlock(editor, 'const a');

    expect(loadEngine).not.toHaveBeenCalled();
    expect(tokenizer.tokenize).toHaveBeenCalled();
    expect(readCodeBlock(editor).supported).toBe(false);
  });

  it('re-highlights when the block’s text changes', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();

        code.getChildren()[0].setTextContent('let');
      },
      { discrete: true },
    );

    const block = readCodeBlock(editor);

    expect(block.text).toBe('let a');
    expect(block.childTypes.every((/** @type {any} */ type) => type === 'code-highlight')).toBe(
      true,
    );
  });

  it('keeps every edit of a rapid burst, so the last one is not dropped', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a');

    ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].forEach((char) => {
      editor.update(
        () => {
          const code = firstBlock();
          const last = code.getChildren().at(-1);

          last.setTextContent(`${last.getTextContent()}${char}`);
        },
        { discrete: true },
      );
    });

    expect(readCodeBlock(editor).text).toBe('abcdefghij');
  });

  it('numbers every line in the gutter', () => {
    const editor = createTestEditor();
    const element = document.createElement('div');

    document.body.append(element);
    editor.setRootElement(element);
    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb\nc');

    expect(element.querySelector('code')?.getAttribute('data-gutter')).toBe('1\n2\n3');

    editor.setRootElement(null);
    element.remove();
  });

  it('leaves the gutter alone when the line count is unchanged', () => {
    const editor = createTestEditor();
    const element = document.createElement('div');

    document.body.append(element);
    editor.setRootElement(element);
    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb');

    const code = /** @type {any} */ (element.querySelector('code'));

    code.setAttribute('data-gutter', 'untouched');

    editor.update(
      () => {
        firstBlock().markDirty();
      },
      { discrete: true },
    );

    expect(code.getAttribute('data-gutter')).toBe('untouched');

    editor.setRootElement(null);
    element.remove();
  });

  // The caret restoration inside `updateAndRetainSelection` cannot be exercised here: with no real
  // browser Selection, `$getSelection()` is null during a transform, so that path always short
  // circuits. These cover the surrounding behavior instead.
  it('re-highlights correctly when an edit also moves the selection', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();
        const last = code.getChildren().at(-1);

        last.setTextContent(`${last.getTextContent()}bc`);
        last.select(2, 2);
      },
      { discrete: true },
    );

    const block = readCodeBlock(editor);

    expect(block.text).toBe('const abc');
    expect(block.childTypes.every((/** @type {any} */ type) => type === 'code-highlight')).toBe(
      true,
    );
  });

  it('re-highlights a multiline block around its line breaks', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb');

    editor.update(
      () => {
        const code = firstBlock();

        code.getChildren().at(-1).setTextContent('bc');
      },
      { discrete: true },
    );

    const block = readCodeBlock(editor);

    expect(block.text).toBe('a\nbc');
    expect(block.childTypes).toContain('linebreak');
  });

  it('turns highlight nodes back into plain text outside a code block', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();
        const highlights = code.getChildren();
        const paragraph = new ParagraphNode();

        getRoot().append(paragraph);
        highlights.forEach((/** @type {any} */ child) => paragraph.append(child));
      },
      { discrete: true },
    );

    /** @type {any[]} */
    let types = [];

    editor.read(() => {
      const paragraph = /** @type {any} */ (getRoot().getChildren().at(-1));

      types = paragraph.getChildren().map((/** @type {any} */ child) => child.getType());
    });

    expect(types.every((/** @type {any} */ type) => type === 'text')).toBe(true);
  });

  it('stops transforming once unregistered', () => {
    const editor = createTestEditor();
    const tokenizer = createTestTokenizer();
    const dispose = registerCodeHighlighting(editor, tokenizer);

    dispose();
    insertCodeBlock(editor, 'const a');

    expect(tokenizer.tokenize).not.toHaveBeenCalled();
    expect(readCodeBlock(editor).childTypes).toEqual(['text']);
  });

  it('writes the line number gutter onto the rendered element', () => {
    const editor = createTestEditor();
    const element = document.createElement('div');

    document.body.append(element);
    editor.setRootElement(element);
    registerCodeHighlighting(editor, createTestTokenizer());

    editor.update(
      () => {
        const code = createCodeNode();

        code.setLanguage('javascript');
        code.append(createTextNode('a'));
        getRoot().clear();
        getRoot().append(code);
      },
      { discrete: true },
    );

    expect(element.querySelector('code')?.getAttribute('data-gutter')).toBe('1');

    editor.setRootElement(null);
    element.remove();
  });
});

describe('shikiTokenizer', () => {
  beforeEach(() => {
    facadeState.engineLoaded = true;
    vi.clearAllMocks();
  });

  it('delegates to Shiki when a grammar is usable', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, shikiTokenizer);
    insertCodeBlock(editor, 'const a');

    expect(getHighlightNodes).toHaveBeenCalled();
    expect(
      readCodeBlock(editor).childTypes.every(
        (/** @type {any} */ type) => type === 'code-highlight',
      ),
    ).toBe(true);
  });

  it('renders plain text without consulting Shiki', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, { ...shikiTokenizer, defaultLanguage: 'plain' });
    insertCodeBlock(editor, 'const a', { language: 'plain' });

    expect(getHighlightNodes).not.toHaveBeenCalled();
  });

  it('leaves a block untouched when the tokenizer opts out of a default language', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, { ...shikiTokenizer, defaultLanguage: null });
    insertCodeBlock(editor, 'const a', { language: null });

    expect(getHighlightNodes).not.toHaveBeenCalled();
    expect(readCodeBlock(editor).language).toBeFalsy();
  });

  it('does not consult Shiki before the engine is loaded', () => {
    facadeState.engineLoaded = false;
    vi.mocked(isCodeLanguageLoaded).mockReturnValue(true);

    const editor = createTestEditor();

    registerCodeHighlighting(editor, shikiTokenizer);
    insertCodeBlock(editor, 'const a');

    expect(getHighlightNodes).not.toHaveBeenCalled();
  });
});
