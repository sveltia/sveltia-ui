import { CodeNode } from '@lexical/code-core';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  LINK as LEXICAL_LINK,
  TRANSFORMERS,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  $createLineBreakNode as createLineBreakNode,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';

import { BLOCK_SYNTAX_ESCAPE, escapeBlockSyntax, unescapeText } from './block-escape.js';
import { LINK } from './link.js';
import { RAW_SYNTAX } from './raw-syntax.js';

// Like the editor, use the link transformer that keeps the formats of the whole link text outside
// the link, and mark the syntax the editor doesn’t support
const transformers = [
  ...TRANSFORMERS.map((transformer) => (transformer === LEXICAL_LINK ? LINK : transformer)),
  RAW_SYNTAX,
  BLOCK_SYNTAX_ESCAPE,
];

/**
 * Create a headless editor with the nodes the Markdown transformers need.
 * @returns {import('lexical').LexicalEditor} Editor.
 */
const createTestEditor = () =>
  createEditor({
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    /**
     * Fail the test on an editor error.
     * @param {Error} error Error.
     * @throws {Error} The same error.
     */
    onError: (error) => {
      throw error;
    },
  });

/**
 * Fill an editor with paragraphs of plain text, the lines of each separated by line breaks, and
 * export it to Markdown.
 * @param {string[][]} paragraphs Lines of each paragraph.
 * @returns {string} Markdown.
 */
const exportParagraphs = (paragraphs) => {
  const editor = createTestEditor();

  editor.update(
    () => {
      getRoot().append(
        ...paragraphs.map((lines) =>
          createParagraphNode().append(
            ...lines.flatMap((line, index) =>
              index ? [createLineBreakNode(), createTextNode(line)] : [createTextNode(line)],
            ),
          ),
        ),
      );
    },
    { discrete: true },
  );

  return editor.read(() => convertToMarkdownString(transformers));
};

/**
 * Transformers to export Markdown with. Like the editor, use `_` for italic text and `**` for bold
 * text.
 */
const exportTransformers = transformers.filter(
  (transformer) => !('tag' in transformer) || !['*', '__', '***', '___'].includes(transformer.tag),
);

/**
 * Fill an editor with a paragraph of text nodes and export it to Markdown.
 * @param {[text: string, ...formats: import('lexical').TextFormatType[]][]} nodes Text and formats
 * of each node.
 * @returns {string} Markdown.
 */
const exportTextNodes = (nodes) => {
  const editor = createTestEditor();

  editor.update(
    () => {
      getRoot().append(
        createParagraphNode().append(
          ...nodes.map(([text, ...formats]) => {
            const node = createTextNode(text);

            formats.forEach((format) => node.toggleFormat(format));

            return node;
          }),
        ),
      );
    },
    { discrete: true },
  );

  return editor.read(() => convertToMarkdownString(exportTransformers));
};

/**
 * Import Markdown into an editor and export it again.
 * @param {string} markdown Markdown.
 * @param {object} [options] Options.
 * @param {boolean} [options.asEditor] Whether to export the formats like the editor; see
 * `exportTransformers`.
 * @returns {string} Exported Markdown.
 */
const roundTrip = (markdown, { asEditor = false } = {}) => {
  const editor = createTestEditor();

  editor.update(() => convertFromMarkdownString(markdown, transformers), { discrete: true });

  return editor.read(() => convertToMarkdownString(asEditor ? exportTransformers : transformers));
};

describe('escapeBlockSyntax()', () => {
  it('escapes an ATX heading', () => {
    expect(escapeBlockSyntax('## Hours')).toBe('\\## Hours');
    expect(escapeBlockSyntax('#')).toBe('\\#');
    expect(escapeBlockSyntax('  ### Hours')).toBe('  \\### Hours');
  });

  it('leaves a hash that doesn’t start a heading', () => {
    expect(escapeBlockSyntax('#hashtag')).toBe('#hashtag');
    expect(escapeBlockSyntax('####### Seven')).toBe('####### Seven');
    expect(escapeBlockSyntax('    # Indented')).toBe('    # Indented');
  });

  it('escapes a bullet list item', () => {
    expect(escapeBlockSyntax('- Item')).toBe('\\- Item');
    expect(escapeBlockSyntax('+ Item')).toBe('\\+ Item');
    expect(escapeBlockSyntax('-')).toBe('\\-');
  });

  it('leaves a minus or plus sign before a number', () => {
    expect(escapeBlockSyntax('-5 degrees')).toBe('-5 degrees');
    expect(escapeBlockSyntax('+1')).toBe('+1');
  });

  it('escapes an ordered list item', () => {
    expect(escapeBlockSyntax('1. Item')).toBe('1\\. Item');
    expect(escapeBlockSyntax('2025) Item')).toBe('2025\\) Item');
  });

  it('leaves a number that doesn’t start a list item', () => {
    expect(escapeBlockSyntax('3.14 is pi')).toBe('3.14 is pi');
    expect(escapeBlockSyntax('1234567890. Too long')).toBe('1234567890. Too long');
  });

  it('escapes a blockquote', () => {
    expect(escapeBlockSyntax('> Quote')).toBe('\\> Quote');
    expect(escapeBlockSyntax('>Quote')).toBe('\\>Quote');
  });

  it('escapes a setext heading underline and a thematic break', () => {
    expect(escapeBlockSyntax('===')).toBe('\\===');
    expect(escapeBlockSyntax('--')).toBe('\\--');
    expect(escapeBlockSyntax('--- ')).toBe('\\--- ');
  });

  it('leaves dashes and equal signs followed by text', () => {
    expect(escapeBlockSyntax('--verbose')).toBe('--verbose');
    expect(escapeBlockSyntax('==> Next')).toBe('==> Next');
  });

  it('leaves plain text', () => {
    expect(escapeBlockSyntax('The dome opens.')).toBe('The dome opens.');
    expect(escapeBlockSyntax('')).toBe('');
  });
});

describe('unescapeText()', () => {
  it('removes the escapes before underscores within a word', () => {
    expect(unescapeText('snake\\_case\\_name and a\\_\\_b and ü\\_1')).toBe(
      'snake_case_name and a__b and ü_1',
    );
  });

  it('keeps the escapes before underscores that could start or end emphasis', () => {
    expect(unescapeText('\\_not em\\_ and a\\_ and \\_b and .\\_a')).toBe(
      '\\_not em\\_ and a\\_ and \\_b and .\\_a',
    );
  });

  it('removes the escapes before literal backslashes', () => {
    expect(unescapeText('C:\\\\Users\\\\me and \\\\alpha and a \\\\ b')).toBe(
      'C:\\Users\\me and \\alpha and a \\ b',
    );
  });

  it('keeps the escapes before backslashes that would escape a character or break a line', () => {
    expect(unescapeText('\\\\\\* and \\\\\\_ and \\\\# and \\\\\n and end\\\\')).toBe(
      '\\\\\\* and \\\\\\_ and \\\\# and \\\\\n and end\\\\',
    );
  });

  it('keeps the other escapes', () => {
    expect(unescapeText('\\* \\` \\~ \\[')).toBe('\\* \\` \\~ \\[');
  });

  it('replaces encoded spaces', () => {
    expect(unescapeText('**&#32;bold&#32;**')).toBe('** bold **');
  });
});

describe('BLOCK_SYNTAX_ESCAPE', () => {
  it('is an export-only text match transformer', () => {
    expect(BLOCK_SYNTAX_ESCAPE.type).toBe('text-match');
    expect(BLOCK_SYNTAX_ESCAPE.regExp.test('## Hours')).toBe(false);
    expect(BLOCK_SYNTAX_ESCAPE.importRegExp).toBeUndefined();
  });

  it('escapes the block syntax at the start of a paragraph', () => {
    expect(exportParagraphs([['The dome opens.'], ['## Hours'], ['1. Item'], ['> Quote']])).toBe(
      'The dome opens.\n\n\\## Hours\n\n1\\. Item\n\n\\> Quote',
    );
  });

  it('escapes the block syntax at the start of a line after a line break', () => {
    expect(exportParagraphs([['Opening hours', '- Monday', '==='], ['A # B']])).toBe(
      'Opening hours\n\\- Monday\n\\===\n\nA # B',
    );
  });

  it('leaves text after the start of a line', () => {
    const editor = createTestEditor();

    editor.update(
      () => {
        getRoot().append(
          createParagraphNode().append(
            createTextNode('Bold').toggleFormat('bold'),
            createTextNode('## not a heading'),
          ),
        );
      },
      { discrete: true },
    );

    expect(editor.read(() => convertToMarkdownString(transformers))).toBe(
      '**Bold**## not a heading',
    );
  });

  it('leaves formatted text, which starts with its own syntax', () => {
    const editor = createTestEditor();

    editor.update(
      () => {
        getRoot().append(
          createParagraphNode().append(createTextNode('## Hours').toggleFormat('bold')),
        );
      },
      { discrete: true },
    );

    expect(editor.read(() => convertToMarkdownString(transformers))).toBe('**## Hours**');
  });

  it('keeps escaped block syntax across an import and an export', () => {
    expect(roundTrip('\\## Hours\n\n1\\. Item\n\n\\- Item\n\n\\> Quote')).toBe(
      '\\## Hours\n\n1\\. Item\n\n\\- Item\n\n\\> Quote',
    );
  });

  it('escapes block syntax at the start of a list item and a blockquote', () => {
    expect(roundTrip('- \\# Hash\n\n> \\# Hash')).toBe('- \\# Hash\n\n> \\# Hash');
  });

  it('leaves the text of a heading, which can’t start a block', () => {
    expect(roundTrip('## \\# Hash\n\n## 1. Intro')).toBe('## # Hash\n\n## 1. Intro');
  });

  it('leaves the text of a link and of a code block', () => {
    expect(roundTrip('[# Hash](https://example.com)\n\n```\n# Comment\n```')).toBe(
      '[# Hash](https://example.com)\n\n```\n# Comment\n```',
    );
  });

  it('leaves real block syntax', () => {
    expect(roundTrip('## Hours\n\n- Item\n\n1. Item\n\n> Quote')).toBe(
      '## Hours\n\n- Item\n\n1. Item\n\n> Quote',
    );
  });
  it('leaves inline code, which Lexical exports verbatim', () => {
    expect(roundTrip('Match `\\\\` and `\\_` in text')).toBe('Match `\\\\` and `\\_` in text');
  });

  it('removes the escapes that are not needed in text, including in a heading and a link', () => {
    expect(roundTrip('a\\_b \\_c\\_ C:\\\\d\n\n## e\\_f\n\n[g\\_h](https://example.com)')).toBe(
      'a_b \\_c\\_ C:\\d\n\n## e_f\n\n[g_h](https://example.com)',
    );
  });

  it('uses asterisks for italic text within a word', () => {
    expect(
      exportTextNodes([
        ['a'],
        ['b', 'italic'],
        ['c_d', 'italic', 'bold'],
        ['e'],
        [' '],
        ['f', 'italic'],
        [' g'],
      ]),
    ).toBe('a*b**c_d***e _f_ g');
  });

  it('uses asterisks for italic text at the start or the end of a word', () => {
    expect(exportTextNodes([['a', 'italic'], ['b'], [' '], ['c'], ['d', 'italic']])).toBe(
      '*a*b c*d*',
    );
  });

  it('uses underscores for italic text with whitespace inside its delimiters', () => {
    expect(exportTextNodes([['a'], [' b ', 'italic'], ['c']])).toBe('a _b_ c');
  });

  it('leaves the block syntax that can’t be nested in a blockquote or a list item', () => {
    const markdown =
      '> - a\n> - b\n\n> ```\n> code\n> ```\n\n> # Heading\n\n> > Quote\n\n> 1. a\n\n> * a\n\n' +
      '> ---\n\n> * * *\n\n- a\n  > Quote';

    expect(roundTrip(markdown)).toBe(markdown);
  });

  it('leaves an ordered list item with a parenthesis, which Lexical doesn’t support', () => {
    expect(roundTrip('1) a\n2) b')).toBe('1) a\n2) b');
  });

  it('closes the formats of formatted whitespace before the whitespace', () => {
    expect(exportTextNodes([['a', 'bold', 'italic'], [' ', 'bold'], ['b']])).toBe('**_a_** b');
    expect(
      exportTextNodes([
        ['a', 'bold'],
        ['  ', 'bold', 'italic'],
      ]),
    ).toBe('**a**  ');
  });

  it('keeps the formats around whitespace before a link across an import and an export', () => {
    expect(roundTrip('**_a_ [b](u)**', { asEditor: true })).toBe('**_a_** **[b](u)**');
    expect(roundTrip('**a _b_ [c](u)**', { asEditor: true })).toBe('**a _b_** **[c](u)**');
    expect(roundTrip('**`a` [b](u)**', { asEditor: true })).toBe('**`a`** **[b](u)**');
    expect(roundTrip('_~~a~~ [b](u)_', { asEditor: true })).toBe('_~~a~~_ _[b](u)_');
    expect(roundTrip('**_a_ [b](u)** c', { asEditor: true })).toBe('**_a_** **[b](u)** c');
  });
});
