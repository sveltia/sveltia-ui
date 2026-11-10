/**
 * Keeping a single-line editor on one line.
 */

import { $isLinkNode as isLinkNode } from '@lexical/link';
import {
  COMMAND_PRIORITY_HIGH,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  LineBreakNode,
  $isElementNode as isElementNode,
  $isParagraphNode as isParagraphNode,
  $isTextNode as isTextNode,
  RootNode,
} from 'lexical';
import { INLINE_BUTTON_TYPES, TEXT_FORMAT_BUTTON_TYPES } from '../constants.js';
import { isInlineComponent } from '../conversion/editor-components.js';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor, LexicalNode } from 'lexical';
 * @import { TextEditorConfig, TextEditorNodeType } from '#lib/typedefs.js';
 */

/**
 * Limit the given editor configuration to what a single-line editor can hold, if it’s one: only
 * the inline buttons and components, and no plain text mode for HTML, whose source can’t be kept to
 * a single paragraph by keeping it on a single line. Any other configuration is returned as is.
 * @param {TextEditorConfig} config Editor configuration.
 * @returns {TextEditorConfig} Limited configuration.
 */
export const limitToSingleLine = (config) => {
  if (config.multiline !== false || config.isCodeEditor) {
    return config;
  }

  return {
    ...config,
    modes: config.format === 'html' ? ['rich-text'] : config.modes,
    enabledButtons: (config.enabledButtons ?? []).filter((button) =>
      /** @type {TextEditorNodeType[]} */ (INLINE_BUTTON_TYPES).includes(button),
    ),
    components: (config.components ?? []).filter(isInlineComponent),
  };
};

/**
 * Get the inline content of the given top-level node, looking into any block within it.
 * @param {LexicalNode} node Node.
 * @returns {LexicalNode[]} Inline nodes, or an empty array for a block that has no inline content,
 * like a horizontal rule.
 */
const getInlineContent = (node) => {
  if (isElementNode(node) && !node.isInline()) {
    return node.getChildren().flatMap(getInlineContent);
  }

  return node.isInline() ? [node] : [];
};

/**
 * Join the top-level nodes of the given root into a single paragraph, with a space between the
 * content of each, for a single-line editor.
 * @param {RootNode} root Root node.
 */
export const $joinIntoSingleParagraph = (root) => {
  const children = root.getChildren();
  const [firstChild] = children;

  if (!firstChild || (children.length === 1 && isParagraphNode(firstChild))) {
    return;
  }

  const paragraph = isParagraphNode(firstChild) ? firstChild : createParagraphNode();

  if (paragraph !== firstChild) {
    firstChild.insertBefore(paragraph);
  }

  // Keep track of the last character rather than reading the growing text of the paragraph again
  // for each block, which would take quadratic time on a long pasted document
  let lastChar = paragraph.getTextContent().at(-1) ?? '';

  children
    .filter((child) => child !== paragraph)
    .forEach((child) => {
      const content = getInlineContent(child);
      const text = content.map((node) => node.getTextContent()).join('');

      // Add a space between the content of each block, unless there’s one already
      if (content.length && paragraph.getChildrenSize() && !/\s/.test(lastChar + text.charAt(0))) {
        paragraph.append(createTextNode(' '));
      }

      paragraph.append(...content);
      lastChar = text.at(-1) ?? lastChar;
      // Lexical moves the selection out of a removed node on its own
      child.remove();
    });
};

/**
 * Replace the given line break with a space for a single-line editor, with the formats the text on
 * both sides shares, so a line break within bold text doesn’t split it. With a space on either side
 * already, or nothing at all, the line break is just removed.
 * @param {LineBreakNode} node Line break.
 */
export const $replaceLineBreak = (node) => {
  const previous = node.getPreviousSibling();
  const next = node.getNextSibling();

  // A line break at either end of the paragraph separates nothing, so it leaves no space
  if (
    !previous ||
    !next ||
    /\s$/.test(previous.getTextContent()) ||
    /^\s/.test(next.getTextContent())
  ) {
    node.remove();

    return;
  }

  const space = createTextNode(' ');

  // A link split over lines, like the ones `splitMultilineFormatting()` makes from a link within
  // formatting, is joined back into one link
  const isSameLink =
    isLinkNode(previous) &&
    isLinkNode(next) &&
    previous.getURL() === next.getURL() &&
    previous.getTitle() === next.getTitle() &&
    previous.getTarget() === next.getTarget() &&
    previous.getRel() === next.getRel();

  // The text next to the line break, also within an inline element like a link
  const before = isElementNode(previous) ? previous.getLastDescendant() : previous;
  const after = isElementNode(next) ? next.getFirstDescendant() : next;

  if (isTextNode(before) && isTextNode(after)) {
    // Keep the formats both sides share, e.g. italic between italic and bold italic text
    TEXT_FORMAT_BUTTON_TYPES.forEach((format) => {
      if (before.hasFormat(format) && after.hasFormat(format)) {
        space.toggleFormat(format);
      }
    });

    if (before.getStyle() === after.getStyle()) {
      space.setStyle(before.getStyle());
    }
  }

  if (isSameLink) {
    previous.append(space, ...next.getChildren());
    next.remove();
    node.remove();

    return;
  }

  node.replace(space);
};

/**
 * Register the commands and transforms that keep a single-line editor on one line. Neither a new
 * paragraph nor a line break can be inserted, and any content that brings them in anyway, like
 * pasted text or an imported value, is joined into a single paragraph with spaces.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup handler.
 */
export const registerSingleLine = (editor) =>
  mergeUnregisters(
    // The emoji autocomplete, which selects an emoji with the Enter key, takes priority
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        event?.preventDefault();

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    ),
    editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => true, COMMAND_PRIORITY_HIGH),
    editor.registerCommand(INSERT_LINE_BREAK_COMMAND, () => true, COMMAND_PRIORITY_HIGH),
    editor.registerNodeTransform(LineBreakNode, $replaceLineBreak),
    editor.registerNodeTransform(RootNode, $joinIntoSingleParagraph),
  );
