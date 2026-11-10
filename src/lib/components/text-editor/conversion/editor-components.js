/**
 * Editor components: custom nodes with their own Markdown transformers.
 */

import {
  createEditor,
  $createParagraphNode as createParagraphNode,
  $getRoot as getRoot,
} from 'lexical';
import { removeImportPlaceholders } from './markdown.js';
import { HTML_BLOCK_PLACEHOLDER } from './transformers/raw-syntax.js';
import { onEditorUpdate } from './update.js';

/**
 * @import { Transformer } from '@lexical/markdown';
 * @import { TextEditorComponent } from '#lib/typedefs.js';
 */

/**
 * Get the Markdown of a new instance of the given editor component, to insert it in the plain text
 * mode. The component’s own `createMarkdown` function is used if any. Otherwise, a new node is
 * created in a temporary editor and exported with the component’s transformer, just like the rich
 * text editor does.
 * @param {TextEditorComponent} component Editor component.
 * @returns {string} Markdown. It can be empty, for example if the component’s output depends on a
 * field value that is not set yet.
 */
export const getComponentMarkdown = ({ node, createNode, transformer, createMarkdown }) => {
  if (createMarkdown) {
    return createMarkdown().trim();
  }

  const editor = createEditor({
    namespace: 'component',
    nodes: node ? [/** @type {any} */ (node)] : [],
    /**
     * Throw an error, so the export below fails as a whole.
     * @param {Error} error Error.
     * @throws {Error} Always.
     */
    onError: (error) => {
      throw error;
    },
  });

  let markdown = '';

  try {
    editor.update(
      () => {
        const newNode = createNode();

        // An inline node needs a paragraph to live in
        getRoot().append(newNode.isInline() ? createParagraphNode().append(newNode) : newNode);

        markdown = onEditorUpdate(editor, [transformer]);
      },
      { discrete: true },
    );
  } catch {
    // The component cannot be created or exported outside the rich text editor
  }

  return markdown.trim();
};

/**
 * Check if the given editor component is inline, which means its Markdown is matched within a line
 * of text by a text match transformer. Only an inline component can be inserted into a Markdown
 * table cell or a single-line editor.
 * @param {TextEditorComponent} component Editor component.
 * @returns {boolean} Result.
 */
export const isInlineComponent = ({ transformer }) => transformer.type === 'text-match';

/**
 * Remove the placeholders added by `addImportPlaceholders()` from a regular expression match.
 * @param {RegExpMatchArray} match Match.
 * @returns {RegExpMatchArray} Match without the placeholders, with the same index and input.
 */
const cleanMatch = (match) => {
  /**
   * Remove the placeholders from a captured string, if any.
   * @param {string | undefined} value Captured string.
   * @returns {string | undefined} Cleaned string.
   */
  const clean = (value) => (value === undefined ? value : removeImportPlaceholders(value));

  return /** @type {RegExpMatchArray} */ (
    Object.assign(match.map(clean), {
      index: match.index,
      input: match.input,
      groups: match.groups
        ? Object.fromEntries(
            Object.entries(match.groups).map(([key, value]) => [key, clean(value)]),
          )
        : undefined,
    })
  );
};

/**
 * Make a regular expression match the text after the placeholder at the start of a line of an HTML
 * block, if any, so the pattern of an editor component, like `^<aside>`, still matches the line.
 * @param {RegExp} regExp Regular expression without the `g` flag.
 * @param {boolean} isLineStart Whether Lexical takes the match as the start of the line and removes
 * it by its length, like that of an element transformer, in which case the match includes the
 * placeholder. Otherwise its index is moved past the placeholder.
 * @returns {RegExp} Regular expression.
 */
const skipHtmlBlockPlaceholder = (regExp, isLineStart) =>
  // Lexical matches the text with `String.prototype.match()`, which calls this method
  Object.assign(new RegExp(regExp), {
    /**
     * Match the text after the placeholder at its start, if any.
     * @param {string} text Text.
     * @returns {RegExpMatchArray | null} Match.
     */
    [Symbol.match]: (text) => {
      const offset = text.startsWith(HTML_BLOCK_PLACEHOLDER) ? 1 : 0;
      const match = text.slice(offset).match(regExp);

      if (!match || !offset) {
        return match;
      }

      match.input = text;

      if (isLineStart && match.index === 0) {
        match[0] = `${HTML_BLOCK_PLACEHOLDER}${match[0]}`;
      } else {
        // The pattern has no `g` flag, so the match has an index
        /** @type {number} */ (match.index) += offset;
      }

      return match;
    },
  });

/**
 * Remove the placeholders added by `addImportPlaceholders()` from an argument of a transformer’s
 * `replace()`: a regular expression match, or the lines of a multiline element.
 * @param {any} arg Argument.
 * @returns {any} Argument without the placeholders.
 */
const cleanReplaceArg = (arg) => {
  if (!Array.isArray(arg)) {
    return arg;
  }

  if ('index' in arg) {
    return cleanMatch(/** @type {RegExpMatchArray} */ (arg));
  }

  return arg.every((item) => typeof item === 'string')
    ? arg.map((line) => removeImportPlaceholders(line))
    : arg;
};

/**
 * Make an editor component’s transformer import the Markdown without the placeholders added by
 * `addImportPlaceholders()`, which `removePlaceholders()` can’t remove from the properties of the
 * component node it creates, like the alt text of an image. The line of an HTML block starts with
 * a placeholder, so the patterns of a component, like `^<aside>`, are matched after it.
 * @param {Transformer} transformer Transformer.
 * @returns {Transformer} Transformer.
 */
export const removePlaceholdersFromMatch = (transformer) => {
  /** @type {any} */
  const {
    type,
    handleImportAfterStartMatch,
    importRegExp,
    regExp,
    regExpStart,
    regExpEnd,
    replace,
  } = transformer;

  /** @type {Record<string, any>} */
  const overrides = {};

  if (handleImportAfterStartMatch) {
    /**
     * Import the lines without the placeholders.
     * @param {{ lines: string[] }} args Arguments.
     * @returns {any} Result.
     */
    overrides.handleImportAfterStartMatch = (args) =>
      handleImportAfterStartMatch({
        ...args,
        lines: args.lines.map((line) => removeImportPlaceholders(line)),
      });
  }

  if (importRegExp) {
    overrides.importRegExp = skipHtmlBlockPlaceholder(importRegExp, false);
  }

  // The regular expression of an element is matched against the start of a line on import
  if (type === 'element' && regExp) {
    overrides.regExp = skipHtmlBlockPlaceholder(regExp, true);
  }

  if (regExpStart) {
    overrides.regExpStart = skipHtmlBlockPlaceholder(regExpStart, true);
  }

  if (regExpEnd instanceof RegExp) {
    overrides.regExpEnd = skipHtmlBlockPlaceholder(regExpEnd, true);
  } else if (regExpEnd?.regExp) {
    overrides.regExpEnd = {
      ...regExpEnd,
      regExp: skipHtmlBlockPlaceholder(regExpEnd.regExp, true),
    };
  }

  if (replace) {
    /**
     * Import the match and the lines without the placeholders.
     * @param {...any} args Arguments.
     * @returns {any} Result.
     */
    overrides.replace = (...args) => replace(...args.map(cleanReplaceArg));
  }

  return /** @type {Transformer} */ ({ ...transformer, ...overrides });
};
