import { CodeNode } from '@lexical/code-core';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
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

import { BLOCK_SYNTAX_ESCAPE, escapeBlockSyntax } from './block-escape.js';

const transformers = [...TRANSFORMERS, BLOCK_SYNTAX_ESCAPE];

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
 * Import Markdown into an editor and export it again.
 * @param {string} markdown Markdown.
 * @returns {string} Exported Markdown.
 */
const roundTrip = (markdown) => {
  const editor = createTestEditor();

  editor.update(() => convertFromMarkdownString(markdown, transformers), { discrete: true });

  return editor.read(() => convertToMarkdownString(transformers));
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
});
