/* eslint-disable jsdoc/require-jsdoc */

import { CodeHighlightNode, CodeNode, $createCodeNode as createCodeNode } from '@lexical/code-core';
import {
  $createLineBreakNode as createLineBreakNode,
  $createParagraphNode as createParagraphNode,
  $createTabNode as createTabNode,
  createEditor,
  $createTextNode as createTextNode,
  $getNodeByKey as getNodeByKey,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
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
    getHighlightNodes(codeNode, 'javascript').flatMap((node) => {
      const text = node.getTextContent();

      if (text === '\n') {
        return [createLineBreakNode()];
      }

      if (text === '\t') {
        return [createTabNode()];
      }

      return [node];
    }),
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

/**
 * Read the caret position.
 * @param {any} editor Editor instance.
 * @returns {{ type: string, text: string, offset: number } | undefined} Anchor’s type, the anchor
 * node’s text content, and offset, or `undefined` when there is no range selection.
 */
const readCaret = (editor) => {
  /** @type {any} */
  let result;

  editor.read(() => {
    const selection = getSelection();

    if (isRangeSelection(selection)) {
      const { anchor } = selection;

      result = {
        type: anchor.type,
        text: anchor.getNode().getTextContent(),
        offset: anchor.offset,
      };
    }
  });

  return result;
};

/**
 * Mount the editor on a detached element so mutation listeners have DOM to work with.
 * @param {any} editor Editor instance.
 * @returns {{ element: HTMLElement, unmount: () => void }} Root element and a cleanup function.
 */
const mount = (editor) => {
  const element = document.createElement('div');

  document.body.append(element);
  editor.setRootElement(element);

  return {
    element,
    unmount: () => {
      editor.setRootElement(null);
      element.remove();
    },
  };
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

  it('withdraws highlighting support when a block is switched to plain text', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    expect(readCodeBlock(editor).supported).toBe(true);

    editor.update(
      () => {
        firstBlock().setLanguage('plain');
      },
      { discrete: true },
    );

    expect(readCodeBlock(editor).supported).toBe(false);
  });

  it('withdraws highlighting support when a block is switched to an unsupported language', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    expect(readCodeBlock(editor).supported).toBe(true);

    editor.update(
      () => {
        firstBlock().setLanguage('nonexistent');
      },
      { discrete: true },
    );

    expect(loadCodeLanguage).toHaveBeenCalledWith(
      'nonexistent',
      expect.anything(),
      expect.any(String),
    );
    expect(readCodeBlock(editor).supported).toBe(false);
  });

  it('highlights several blocks inserted in one update', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());

    editor.update(
      () => {
        getRoot().clear();

        ['const a', 'let b'].forEach((text) => {
          const code = createCodeNode();

          code.setLanguage('javascript');
          code.append(createTextNode(text));
          getRoot().append(code);
        });
      },
      { discrete: true },
    );

    /** @type {any[]} */
    let types = [];

    editor.read(() => {
      types = getRoot()
        .getChildren()
        .map((/** @type {any} */ code) =>
          code.getChildren().map((/** @type {any} */ child) => child.getType()),
        );
    });

    expect(types).toEqual([
      ['code-highlight', 'code-highlight', 'code-highlight'],
      ['code-highlight', 'code-highlight', 'code-highlight'],
    ]);
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

  it('leaves the caret alone when an edit does not change the tokens', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();
        const last = code.getChildren().at(-1);

        // Growing the last token in place yields the same node list, so nothing is replaced
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
    expect(readCaret(editor)).toEqual({ type: 'text', text: 'abc', offset: 2 });
  });

  it('keeps the caret at the same text offset after the tokens are rebuilt', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();
        const last = code.getChildren().at(-1);

        // Splitting the last token into three replaces it, so the caret has to be restored
        last.setTextContent('a b');
        last.select(3, 3);
      },
      { discrete: true },
    );

    expect(readCodeBlock(editor).childTypes).toHaveLength(5);
    expect(readCaret(editor)).toEqual({ type: 'text', text: 'b', offset: 1 });
  });

  it('keeps the caret at the start of a line after the tokens are rebuilt', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb');

    editor.update(
      () => {
        const code = firstBlock();

        code.getChildren().at(-1).setTextContent('b c');
        // An element point right after the line break
        code.select(2, 2);
      },
      { discrete: true },
    );

    expect(readCodeBlock(editor).childTypes).toEqual([
      'code-highlight',
      'linebreak',
      'code-highlight',
      'code-highlight',
      'code-highlight',
    ]);
    expect(readCaret(editor)).toEqual({ type: 'element', text: 'a\nb c', offset: 2 });
  });

  it('puts the caret on the block itself when its offset lands on a line break', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, '\nb');

    editor.update(
      () => {
        const code = firstBlock();

        code.getChildren().at(-1).setTextContent('b c');
        // An element point at the very start, before the leading line break
        code.select(0, 0);
      },
      { discrete: true },
    );

    expect(readCodeBlock(editor).childTypes).toEqual([
      'linebreak',
      'code-highlight',
      'code-highlight',
      'code-highlight',
    ]);
    // A line break cannot host a text point, so the caret becomes an element point on the block
    expect(readCaret(editor)).toEqual({ type: 'element', text: '\nb c', offset: 0 });
  });

  it('falls back to the end of the block when the offset runs past its content', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());

    editor.update(
      () => {
        const paragraph = createParagraphNode();
        const code = createCodeNode();

        paragraph.append(createTextNode('hello world'));
        code.setLanguage('javascript');
        code.append(createTextNode('a'));
        getRoot().clear();
        getRoot().append(paragraph, code);
      },
      { discrete: true },
    );

    editor.update(
      () => {
        const code = /** @type {any} */ (getRoot().getChildren()[1]);

        code.getChildren().at(-1).setTextContent('a b');
        // An element point at the end of the block. The offset is measured from the block’s
        // preceding siblings, which are longer than the block’s content
        code.select(1, 1);
      },
      { discrete: true },
    );

    expect(readCaret(editor)).toEqual({ type: 'element', text: 'a b', offset: 3 });
  });

  it('keeps the caret at the same text offset on a later line', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb');

    editor.update(
      () => {
        const code = firstBlock();
        const last = code.getChildren().at(-1);

        last.setTextContent('b c');
        last.select(1, 1);
      },
      { discrete: true },
    );

    // The line break before the caret counts for one character on the way there
    expect(readCaret(editor)).toEqual({ type: 'text', text: 'b', offset: 1 });
  });

  it('replaces only the tokens that changed', () => {
    const editor = createTestEditor();
    const tokenizer = createTestTokenizer();

    registerCodeHighlighting(editor, tokenizer);
    insertCodeBlock(editor, 'a\tb c');

    /** @type {any[]} */
    let before = [];

    editor.read(() => {
      before = firstBlock().getChildren();
    });

    editor.update(
      () => {
        const code = firstBlock();
        const first = code.getChildren()[0];

        // Changes the first token only; the tab and the rest of the line are kept as they are
        first.setTextContent('x y');
        first.select(1, 1);
      },
      { discrete: true },
    );

    /** @type {any[]} */
    let after = [];

    editor.read(() => {
      after = firstBlock().getChildren();
    });

    expect(after.map((node) => node.getType())).toEqual([
      'code-highlight',
      'code-highlight',
      'code-highlight',
      'tab',
      'code-highlight',
      'code-highlight',
      'code-highlight',
    ]);
    // The trailing nodes are the very same instances as before the edit
    expect(after.slice(-4).map((node) => node.getKey())).toEqual(
      before.slice(-4).map((node) => node.getKey()),
    );
    expect(readCaret(editor)).toEqual({ type: 'text', text: 'x', offset: 1 });
  });

  it('leaves the caret where it is when it is outside the block', () => {
    const editor = createTestEditor();

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'const a');

    editor.update(
      () => {
        const code = firstBlock();
        const paragraph = createParagraphNode();
        const text = createTextNode('elsewhere');

        paragraph.append(text);
        getRoot().append(paragraph);
        code.getChildren().at(-1).setTextContent('a b');
        text.select(4, 4);
      },
      { discrete: true },
    );

    // The block is still re-highlighted, but the caret is not dragged into it
    expect(readCodeBlock(editor).childTypes).toHaveLength(5);
    expect(readCaret(editor)).toEqual({ type: 'text', text: 'elsewhere', offset: 4 });
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

  it('numbers an existing block when registered after the fact', () => {
    const editor = createTestEditor();
    const { element, unmount } = mount(editor);

    insertCodeBlock(editor, 'a\nb');

    const code = element.querySelector('code');

    expect(code?.hasAttribute('data-gutter')).toBe(false);

    registerCodeHighlighting(editor, createTestTokenizer());

    // The block is still a single text node at this point, as nothing has highlighted it yet
    expect(code?.getAttribute('data-gutter')).toBe('1');

    unmount();
  });

  it('skips the gutter of a block that is not rendered', () => {
    const editor = createTestEditor();

    insertCodeBlock(editor, 'a\nb');

    // Registering reports the existing block as created, but there is no element to write to
    expect(() => registerCodeHighlighting(editor, createTestTokenizer())).not.toThrow();
  });

  it('skips the gutter of a block that has been removed', () => {
    const editor = createTestEditor();
    const { element, unmount } = mount(editor);

    registerCodeHighlighting(editor, createTestTokenizer());
    insertCodeBlock(editor, 'a\nb');

    editor.update(
      () => {
        getRoot().clear();
      },
      { discrete: true },
    );

    expect(element.querySelector('code')).toBeNull();

    unmount();
  });

  it('skips the gutter of a block that is gone from the latest state', () => {
    const editor = createTestEditor();
    const { unmount } = mount(editor);

    // A listener registered first runs first, and removing the block from within it leaves the
    // highlighter’s own listener looking at a key that no longer resolves
    editor.registerMutationListener(CodeNode, (/** @type {Map<string, string>} */ mutations) => {
      mutations.forEach((type, key) => {
        if (type === 'created') {
          editor.update(
            () => {
              getNodeByKey(key)?.remove();
            },
            { discrete: true },
          );
        }
      });
    });
    registerCodeHighlighting(editor, createTestTokenizer());

    expect(() => insertCodeBlock(editor, 'a\nb')).not.toThrow();

    unmount();
  });

  it('does not track the gutter of a headless editor', () => {
    const editor = createTestEditor();
    const registerMutationListener = vi.spyOn(editor, 'registerMutationListener');

    // What `@lexical/headless` sets
    editor._headless = true;
    registerCodeHighlighting(editor, createTestTokenizer());

    expect(registerMutationListener).not.toHaveBeenCalled();
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
