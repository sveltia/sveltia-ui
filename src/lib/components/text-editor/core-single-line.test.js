import {
  $createHorizontalRuleNode as createHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/extension';
import { $createLinkNode as createLinkNode } from '@lexical/link';
import { $createQuoteNode as createQuoteNode } from '@lexical/rich-text';
import { TableNode } from '@lexical/table';
import {
  $createLineBreakNode as createLineBreakNode,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  $isTextNode as isTextNode,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import {
  $joinIntoSingleParagraph,
  $replaceLineBreak,
  convertMarkdownToLexical,
  initEditor,
  isInlineComponent,
  limitToSingleLine,
} from './core.js';
import { HR } from './transformers/hr.js';
import { expectLinearTime } from '../../test-utils/complexity.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { TextEditorConfig } from '#lib/typedefs.js';
 */

/** @type {(() => void)[]} */
const disposers = [];

/**
 * Create a single-line editor, or a multiline one with `multiline: true`.
 * @param {Partial<TextEditorConfig>} [config] Configuration.
 * @returns {ReturnType<typeof initEditor>} Editor.
 */
const createEditor = (config = {}) => {
  const result = initEditor({
    modes: ['rich-text'],
    enabledButtons: ['bold', 'italic', 'link'],
    components: [],
    useMarkdownShortcuts: false,
    isCodeEditor: false,
    multiline: false,
    ...config,
  });

  disposers.push(result.dispose);

  return result;
};

/**
 * Get the types of the top-level nodes and the text of the editor.
 * @param {LexicalEditor} editor Editor.
 * @returns {{ types: string[], text: string }} Node types and text.
 */
const readContent = (editor) =>
  editor.getEditorState().read(() => ({
    types: getRoot()
      .getChildren()
      .map((node) => node.getType()),
    text: getRoot().getTextContent(),
  }));

/**
 * Run the given function in a discrete editor update. The editor only logs an error thrown within
 * an update, so it’s rethrown here, to fail the test on a failed assertion.
 * @param {LexicalEditor} editor Editor.
 * @param {() => void} fn Function.
 * @throws {unknown} Error thrown by the function.
 */
const runUpdate = (editor, fn) => {
  /** @type {unknown} */
  let error;

  editor.update(
    () => {
      try {
        fn();
      } catch (ex) {
        error = ex;
      }
    },
    { discrete: true },
  );

  if (error) {
    throw error;
  }
};

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
});

describe('single-line editor', () => {
  it('joins the paragraphs and lines of an imported value with spaces', async () => {
    const { editor, enabledTransformers } = createEditor();

    const exported = await convertMarkdownToLexical(
      editor,
      'One\n\n**Two**  \nThree\n\n> Four\n\n---',
      enabledTransformers,
    );

    // Without a quote button, the quote is kept as text
    expect(readContent(editor)).toEqual({
      types: ['paragraph'],
      text: 'One Two Three > Four ---',
    });
    expect(exported).not.toContain('\n');
    expect(exported).toContain('**Two**');
  });

  it('supports neither horizontal rules nor tables', () => {
    const singleLine = createEditor();
    const multiline = createEditor({ multiline: true });

    expect(singleLine.editor.hasNodes([HorizontalRuleNode])).toBe(false);
    expect(singleLine.editor.hasNodes([TableNode])).toBe(false);
    expect(singleLine.enabledTransformers).not.toContain(HR);
    expect(multiline.editor.hasNodes([HorizontalRuleNode, TableNode])).toBe(true);
    expect(multiline.enabledTransformers).toContain(HR);
  });

  it('ignores the Enter key and the commands that would add a paragraph or a line', async () => {
    const { editor, enabledTransformers } = createEditor();

    await convertMarkdownToLexical(editor, 'One', enabledTransformers);
    runUpdate(editor, () => getRoot().selectEnd());

    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

    expect(editor.dispatchCommand(KEY_ENTER_COMMAND, event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(editor.dispatchCommand(KEY_ENTER_COMMAND, null)).toBe(true);
    expect(editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)).toBe(true);
    expect(editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false)).toBe(true);
    expect(readContent(editor)).toEqual({ types: ['paragraph'], text: 'One' });
  });

  it('joins inserted paragraphs and line breaks, like pasted content', () => {
    const { editor } = createEditor();

    runUpdate(editor, () => {
      getRoot()
        .clear()
        .append(
          createParagraphNode().append(
            createTextNode('One'),
            createLineBreakNode(),
            createTextNode('Two'),
          ),
          // An empty paragraph adds no space
          createParagraphNode(),
          createParagraphNode().append(createTextNode('Three')),
        );
    });

    expect(readContent(editor)).toEqual({ types: ['paragraph'], text: 'One Two Three' });
  });

  it('keeps a line break within bold text bold', async () => {
    const { editor, enabledTransformers } = createEditor();

    const exported = await convertMarkdownToLexical(
      editor,
      '**One  \nTwo** and _three  \n**four**_',
      enabledTransformers,
    );

    expect(readContent(editor).text).toBe('One Two and three four');
    expect(exported).toBe('**One Two** and _three **four**_');
  });

  it('joins a link split over lines into one link, but not different links', async () => {
    const { editor, enabledTransformers } = createEditor();

    expect(
      await convertMarkdownToLexical(
        editor,
        '**[a\nb](u)** and [c](v)\n[d](w)',
        enabledTransformers,
      ),
    ).toBe('**[a b](u)** and [c](v) [d](w)');
  });

  it('formats a space next to a link like the text on both sides', async () => {
    const { editor, enabledTransformers } = createEditor();

    await convertMarkdownToLexical(editor, '**[a](u)\nb**', enabledTransformers);

    // Lexical closes the formatting around a link on export anyway, so the text nodes are checked
    expect(
      editor.getEditorState().read(() =>
        getRoot()
          .getAllTextNodes()
          .map((node) => [node.getTextContent(), node.hasFormat('bold')]),
      ),
    ).toEqual([
      ['a', true],
      [' b', true],
    ]);
  });

  it('allows paragraphs and line breaks in a multiline editor', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      getRoot()
        .clear()
        .append(
          createParagraphNode().append(
            createTextNode('One'),
            createLineBreakNode(),
            createTextNode('Two'),
          ),
          createParagraphNode().append(createTextNode('Three')),
        );
    });

    expect(readContent(editor)).toEqual({
      types: ['paragraph', 'paragraph'],
      text: 'One\nTwo\n\nThree',
    });
  });
});

describe('$joinIntoSingleParagraph', () => {
  it('leaves an empty root or a single paragraph alone', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      const root = getRoot().clear();

      $joinIntoSingleParagraph(root);
      expect(root.getChildrenSize()).toBe(0);

      const paragraph = createParagraphNode().append(createTextNode('One'));

      root.append(paragraph);
      $joinIntoSingleParagraph(root);
      expect(root.getFirstChild()).toBe(paragraph);
    });
  });

  it('starts a new paragraph when the first node is another block, dropping a rule', () => {
    const { editor } = createEditor({ multiline: true, enabledButtons: ['blockquote'] });

    runUpdate(editor, () => {
      const root = getRoot().clear();

      root.append(
        createQuoteNode().append(createTextNode('One')),
        createHorizontalRuleNode(),
        createParagraphNode().append(createTextNode('Two')),
      );
      $joinIntoSingleParagraph(root);
      expect(root.getChildren().map((node) => node.getType())).toEqual(['paragraph']);
      expect(root.getTextContent()).toBe('One Two');
    });
  });

  it('keeps the selection in the joined paragraph', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      const root = getRoot().clear();
      const one = createTextNode('One');
      const empty = createParagraphNode();

      root.append(createParagraphNode().append(one), createParagraphNode(), empty);
      one.select(1, 1);
      $joinIntoSingleParagraph(root);

      let selection = getSelection();

      expect(isRangeSelection(selection) && selection.anchor.getNode()).toBe(one);
      expect(isRangeSelection(selection) && selection.anchor.offset).toBe(1);

      root.append(createParagraphNode().append(createTextNode('Two')), empty);
      empty.select();
      $joinIntoSingleParagraph(root);
      selection = getSelection();
      expect(root.getTextContent()).toBe('One Two');
      // The selection was in a removed paragraph, so Lexical moves it to one that’s still there
      expect(isRangeSelection(selection) && selection.anchor.getNode().isAttached()).toBe(true);
    });
  });
});

describe('$joinIntoSingleParagraph spacing', () => {
  it('joins many paragraphs in linear time', () => {
    const { editor } = createEditor({ multiline: true });

    expectLinearTime(
      (size) => size,
      (size) => {
        runUpdate(editor, () => {
          const root = getRoot().clear();

          for (let index = 0; index < size; index += 1) {
            root.append(createParagraphNode().append(createTextNode('Paragraph')));
          }

          $joinIntoSingleParagraph(root);
        });
      },
      // Large enough for the time a quadratic join takes to stand out from building the nodes
      1000,
    );
  });

  it('adds no space next to one that’s there already', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      const root = getRoot().clear();

      root.append(
        createParagraphNode().append(createTextNode('One ')),
        createParagraphNode().append(createTextNode('Two')),
        createParagraphNode().append(createTextNode(' Three')),
      );
      $joinIntoSingleParagraph(root);
      expect(root.getTextContent()).toBe('One Two Three');
    });
  });
});

describe('$replaceLineBreak', () => {
  it('replaces a line break with a space, formatted like the text around it', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      const bold = createTextNode('One').toggleFormat('bold');
      const lineBreak = createLineBreakNode();

      const paragraph = createParagraphNode().append(
        bold,
        lineBreak,
        createTextNode('Two').toggleFormat('bold'),
      );

      getRoot().clear().append(paragraph);
      $replaceLineBreak(lineBreak);

      const space = bold.getNextSibling();

      expect(isTextNode(space) && space.hasFormat('bold')).toBe(true);
      expect(paragraph.getTextContent()).toBe('One Two');
    });
  });

  it('adds a plain space between text formatted differently, or none next to a space', () => {
    const { editor } = createEditor({ multiline: true });

    runUpdate(editor, () => {
      const one = createTextNode('One').toggleFormat('bold').setStyle('color: red');
      const first = createLineBreakNode();
      const second = createLineBreakNode();

      const paragraph = createParagraphNode().append(
        one,
        first,
        createTextNode('Two '),
        second,
        createTextNode('Three'),
      );

      getRoot().clear().append(paragraph);
      $replaceLineBreak(first);
      $replaceLineBreak(second);

      const space = one.getNextSibling();

      expect(isTextNode(space) && space.getFormat()).toBe(0);
      expect(isTextNode(space) && space.getStyle()).toBe('');
      expect(paragraph.getTextContent()).toBe('One Two Three');

      // Next to a link, the space is plain
      const link = createLinkNode('https://example.com').append(createTextNode('Link'));
      const nextToLink = createLineBreakNode();

      getRoot()
        .clear()
        .append(
          createParagraphNode().append(
            link,
            nextToLink,
            createTextNode('Text').toggleFormat('bold'),
          ),
        );
      $replaceLineBreak(nextToLink);
      expect(getRoot().getTextContent()).toBe('Link Text');

      const plainSpace = link.getNextSibling();

      expect(isTextNode(plainSpace) && plainSpace.getFormat()).toBe(0);

      // A line break at either end of a paragraph leaves no space
      const leading = createLineBreakNode();
      const trailing = createLineBreakNode();

      getRoot()
        .clear()
        .append(createParagraphNode().append(leading, createTextNode('Four'), trailing));
      $replaceLineBreak(leading);
      $replaceLineBreak(trailing);
      expect(getRoot().getTextContent()).toBe('Four');
    });
  });
});

describe('limitToSingleLine', () => {
  const image = /** @type {any} */ ({ transformer: { type: 'text-match' } });
  const figure = /** @type {any} */ ({ transformer: { type: 'element' } });

  /** @type {TextEditorConfig} */
  const config = {
    modes: ['plain-text', 'rich-text'],
    enabledButtons: ['bold', 'link', 'heading-2', 'table'],
    components: [image, figure],
    useMarkdownShortcuts: true,
    isCodeEditor: false,
    multiline: false,
  };

  it('keeps only the inline buttons and components', () => {
    expect(limitToSingleLine(config)).toEqual({
      ...config,
      enabledButtons: ['bold', 'link'],
      components: [image],
    });
    expect(isInlineComponent(image)).toBe(true);
    expect(isInlineComponent(figure)).toBe(false);
  });

  it('leaves only the rich text mode for HTML', () => {
    expect(limitToSingleLine({ ...config, format: 'html' }).modes).toEqual(['rich-text']);
  });

  it('leaves a multiline editor and a code editor alone', () => {
    const multiline = { ...config, multiline: true };
    const codeEditor = { ...config, isCodeEditor: true };

    expect(limitToSingleLine(multiline)).toBe(multiline);
    expect(limitToSingleLine(codeEditor)).toBe(codeEditor);
  });

  it('handles a configuration without buttons or components', () => {
    const limited = limitToSingleLine(
      /** @type {any} */ ({ modes: ['rich-text'], multiline: false }),
    );

    expect(limited.enabledButtons).toEqual([]);
    expect(limited.components).toEqual([]);
  });
});
