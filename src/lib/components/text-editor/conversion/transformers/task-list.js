import { CHECK_LIST } from '@lexical/markdown';
import { $isTextNode as isTextNode } from 'lexical';

/**
 * @import { ElementTransformer } from '@lexical/markdown';
 */

/**
 * Start of a task list item as GitHub Flavored Markdown defines it: a bullet list marker followed
 * by a check box holding a space or `x`, like `- [ ] item`. Like Lexical’s `CHECK_LIST`, it allows
 * one or two spaces between them; with more, the line is a bulleted list item starting with `[ ]`.
 * Like the other block checks in the plain text mode, it doesn’t allow any indentation, which a
 * nested item has.
 * @see https://github.github.com/gfm/#task-list-items-extension-
 */
export const TASK_LIST_ITEM_REGEX = /^[-*+][ \t]{1,2}\[[ xX]\][ \t]/;

/**
 * Transformer for task list items, based on Lexical’s `CHECK_LIST`, which also takes a line without
 * a list marker or with an empty check box, like `[x] Agreed` or `[] Empty`, for a task list item.
 * That suits a Markdown shortcut, like typing `[ ] ` at the start of a paragraph, but would turn
 * such a paragraph into a task list when Markdown is imported, so an import only takes a line that
 * matches {@link TASK_LIST_ITEM_REGEX}, leaving any other line to the other transformers. Lexical
 * has already removed the matched text from the line by then, and doesn’t put it back when a
 * transformer leaves the line, so it’s restored here.
 * @type {ElementTransformer}
 */
export const TASK_LIST = {
  ...CHECK_LIST,
  /**
   * Replace the matched line with a task list item, unless it’s imported and isn’t one.
   * @param {Parameters<ElementTransformer['replace']>} args Arguments.
   * @returns {boolean | void} `false` if the line isn’t a task list item.
   */
  replace: (...args) => {
    const [, children, match, isImport] = args;

    // The match includes the indentation of a nested item
    if (isImport && !TASK_LIST_ITEM_REGEX.test(match[0].trimStart())) {
      const [textNode] = children;

      if (isTextNode(textNode)) {
        textNode.setTextContent(
          /** @type {string} */ (/** @type {RegExpMatchArray} */ (match).input),
        );
      }

      return false;
    }

    return CHECK_LIST.replace(...args);
  },
};
