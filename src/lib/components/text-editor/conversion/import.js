/**
 * Importing a Markdown or HTML value to the editor.
 */

import { $generateNodesFromDOM as generateNodesFromDOM } from '@lexical/html';
import { $isLinkNode as isLinkNode } from '@lexical/link';
import {
  HEADING,
  $convertFromMarkdownString as convertFromMarkdownString,
  $generateNodesFromMarkdownString as generateNodesFromMarkdownString,
} from '@lexical/markdown';
import {
  $createParagraphNode as createParagraphNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  HISTORY_MERGE_TAG,
  $isDecoratorNode as isDecoratorNode,
  $isElementNode as isElementNode,
  $isTextNode as isTextNode,
} from 'lexical';
import { IMPORT_UPDATE_TAG } from '../constants.js';
import { exportHtml, findUnsupportedNode, getCodeLanguage } from './html.js';
import {
  addImportPlaceholders,
  convertSetextHeadings,
  convertTildeFences,
  padBlankBlockquoteLines,
  removeImportPlaceholders,
  splitMultilineFormatting,
} from './markdown.js';
import { loadCodeHighlighter } from '../shiki/preload.js';
import { CODE } from './transformers/code.js';
import { addCodeSpanSplit } from './transformers/formatted-code.js';
import { getImportedRawSyntax } from './transformers/raw-syntax.js';
import { exportMarkdown } from './update.js';

/**
 * @import { ElementNode, LexicalEditor, LexicalNode } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 */

/**
 * Remove the placeholders added by `addImportPlaceholders()` from the imported nodes: the text, the
 * Markdown of raw syntax, and the URL and title of a link. The text of raw syntax is restored from
 * the Markdown it was imported from, as Lexical has removed its escapes, which are not escapes in
 * raw HTML; see `RAW_HTML`.
 * @param {LexicalNode[]} nodes Imported nodes.
 */
const removePlaceholders = (nodes) => {
  nodes
    .flatMap((node) => (isElementNode(node) ? node.getAllTextNodes() : node))
    .filter((node) => isTextNode(node))
    .forEach((node) => {
      const text = node.getTextContent();
      const newText = removeImportPlaceholders(getImportedRawSyntax(node) ?? text);
      const link = node.getParent();

      if (newText !== text) {
        node.setTextContent(newText);
      }

      if (isLinkNode(link)) {
        const url = link.getURL();
        const title = link.getTitle();

        if (removeImportPlaceholders(url) !== url) {
          link.setURL(removeImportPlaceholders(url));
        }

        if (title && removeImportPlaceholders(title) !== title) {
          link.setTitle(removeImportPlaceholders(title));
        }
      }
    });
};

/**
 * Prepare Markdown for the import: convert the syntax Lexical doesn’t support to the one it does,
 * if the element is enabled, and list the programming languages used in the code blocks.
 * @param {string} value Markdown.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @returns {{ markdown: string, languages: string[] }} Normalized Markdown and the languages.
 */
export const prepareMarkdown = (value, enabledTransformers) => {
  // Tilde code fences are converted to backtick ones, and setext headings to ATX ones. Otherwise
  // the syntax is kept as text, as written. A transformer is found by its regular expression,
  // because the transformers can come wrapped in a `$state` proxy, which leaves a regular
  // expression as is but not the transformer object itself
  const hasCodeBlocks = enabledTransformers.some(
    (transformer) => 'regExpStart' in transformer && transformer.regExpStart === CODE.regExpStart,
  );

  const hasHeadings = enabledTransformers.some(
    (transformer) => 'regExp' in transformer && transformer.regExp === HEADING.regExp,
  );

  const fencedValue = hasCodeBlocks ? convertTildeFences(value) : value;
  const markdown = hasHeadings ? convertSetextHeadings(fencedValue) : fencedValue;

  return {
    markdown,
    // The language is the leading word of the info string, like `js` in ```` ``` js title=x ````;
    // see `CODE`
    languages: [...markdown.matchAll(/^`{3,}[ \t]*(?<lang>[\w-]+)/gm)].map(
      ({ groups: { lang = 'plain' } = {} }) => lang,
    ),
  };
};

/**
 * Convert Markdown prepared with {@link prepareMarkdown} to Lexical nodes, either replacing the
 * content of the root or returning the nodes to be inserted somewhere. Called within an editor
 * update.
 * @param {string} markdown Markdown.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @param {object} [options] Options.
 * @param {boolean} [options.toRoot] Whether to replace the content of the root.
 * @returns {LexicalNode[]} Imported nodes.
 */
export const $importMarkdown = (markdown, enabledTransformers, { toRoot = false } = {}) => {
  // Split multiline formatting into separate lines to prevent Markdown parsing issues
  const splitValue = splitMultilineFormatting(markdown);
  // Add placeholders so Lexical reads the backslashes, the tabs in code spans and raw HTML right
  const markedValue = addImportPlaceholders(splitValue);
  // Pad blank blockquote lines so they are not imported as literal `>` text
  const paddedValue = padBlankBlockquoteLines(markedValue);
  // Keep the formatting around a code span after other formatting
  const transformers = addCodeSpanSplit(enabledTransformers);
  /** @type {LexicalNode[]} */
  let nodes;

  if (toRoot) {
    convertFromMarkdownString(paddedValue, transformers);
    nodes = getRoot().getChildren();
  } else {
    nodes = generateNodesFromMarkdownString(paddedValue, transformers);
  }

  // The text of raw HTML and raw syntax is restored as well. The lines of an HTML block have a
  // placeholder. Other raw syntax, like an autolink or a definition label, only differs from its
  // text if Lexical has decoded an escape or a character reference in it
  if (markedValue !== splitValue || /[\\&]/.test(markedValue)) {
    removePlaceholders(nodes);
  }

  return nodes;
};

/**
 * Number of the latest import started for each editor.
 * @type {WeakMap<LexicalEditor, number>}
 */
const latestImports = new WeakMap();

/**
 * Import a value to the editor, replacing the current content.
 * @param {LexicalEditor} editor Editor instance.
 * @param {object} args Arguments.
 * @param {string[]} args.languages Programming languages used in the code blocks.
 * @param {() => void} args.$import Function to convert the value to Lexical nodes, called within an
 * editor update.
 * @param {() => string} args.$export Function to convert the editor content back to the value.
 * @param {string} args.formatName Name of the value format, used in the error message.
 * @returns {Promise<string | undefined>} The value as the editor exports it once imported, which
 * can differ in style from the given value. `undefined` if another import has been started for the
 * same editor in the meantime, in which case this value is skipped.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
const importValue = async (editor, { languages, $import, $export, formatName }) => {
  const importId = (latestImports.get(editor) ?? 0) + 1;

  latestImports.set(editor, importId);

  /**
   * Check if a newer import has been started while waiting for the highlighter. Imports can finish
   * out of order, as only those with code blocks have to wait, and an older value must not
   * overwrite a newer one.
   * @returns {boolean} Result.
   */
  const isSuperseded = () => latestImports.get(editor) !== importId;

  try {
    // Preload the highlighter for every language used in the document, so code blocks are
    // highlighted as soon as they appear rather than a moment later
    await Promise.all(languages.map(async (lang) => loadCodeHighlighter(lang)));
  } catch (ex) {
    if (isSuperseded()) {
      return undefined;
    }

    throw ex;
  }

  if (isSuperseded()) {
    return undefined;
  }

  // Lexical commits an empty state when the root element is attached, and the history keeps it as
  // the current entry. An empty state can’t be restored, so undoing to it throws an error. Merge
  // the first import into that entry instead of pushing it onto the undo stack
  const isEmpty = editor.getEditorState().isEmpty();
  /** @type {unknown} */
  let error;

  editor.update(
    () => {
      try {
        $import();
      } catch (ex) {
        error = ex;
      }
    },
    // Tell the import from a change made by the user, and commit it right away, so the node
    // transforms, e.g. the one giving a code block its default language, have run by the time the
    // content is exported below
    { tag: isEmpty ? [IMPORT_UPDATE_TAG, HISTORY_MERGE_TAG] : IMPORT_UPDATE_TAG, discrete: true },
  );

  if (error) {
    throw new Error(`Failed to convert ${formatName}`, { cause: error });
  }

  return editor.read($export);
};

/**
 * Convert Markdown to Lexical nodes.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} value Current Markdown value.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @returns {Promise<string | undefined>} The value as the editor exports it once imported, which
 * can differ in style from the given value, e.g. `_text_` for `*text*`. `undefined` if another
 * import has been started for the same editor in the meantime, in which case this value is skipped.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
export const convertMarkdownToLexical = async (editor, value, enabledTransformers) => {
  const { markdown, languages } = prepareMarkdown(value, enabledTransformers);

  return importValue(editor, {
    languages,
    /**
     * Import the Markdown.
     */
    $import: () => {
      $importMarkdown(markdown, enabledTransformers, { toRoot: true });
    },
    /**
     * Export the content as Markdown.
     * @returns {string} Markdown.
     */
    $export: () => exportMarkdown(enabledTransformers),
    formatName: 'Markdown',
  });
};

/**
 * Convert HTML to Lexical nodes. Inline content outside any block, like bare text, is wrapped with
 * a paragraph. An element that none of the registered nodes can import, like `<img>` or a heading
 * with the heading buttons disabled, as well as a comment, causes an error instead of being
 * silently dropped.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} value Current HTML value.
 * @returns {Promise<string | undefined>} The value as the editor exports it once imported, which
 * can differ in style from the given value, e.g. `<strong>` for `<b>`. `undefined` if another
 * import has been started for the same editor in the meantime, in which case this value is skipped.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
export const convertHtmlToLexical = async (editor, value) => {
  const dom = new DOMParser().parseFromString(value, 'text/html');

  return importValue(editor, {
    languages: [...dom.querySelectorAll('pre > code')]
      .map(getCodeLanguage)
      .filter((lang) => lang !== undefined),
    /**
     * Import the HTML.
     * @throws {Error} The HTML has an element the editor cannot handle.
     */
    $import: () => {
      const unsupportedNode = findUnsupportedNode(editor, dom);

      if (unsupportedNode) {
        throw new Error(
          unsupportedNode.nodeType === Node.COMMENT_NODE
            ? 'Unsupported comment'
            : `Unsupported element: <${/** @type {Element} */ (unsupportedNode).localName}>`,
        );
      }

      const root = getRoot();
      /** @type {ElementNode | null} */
      let paragraph = null;

      root.clear();

      generateNodesFromDOM(editor, dom).forEach((node) => {
        if (isElementNode(node) ? !node.isInline() : isDecoratorNode(node) && !node.isInline()) {
          paragraph = null;
          root.append(node);
        } else {
          if (!paragraph) {
            paragraph = createParagraphNode();
            root.append(paragraph);
          }

          paragraph.append(node);
        }
      });

      // Like the Markdown import, there should be at least one paragraph
      // @see https://github.com/facebook/lexical/issues/2308
      if (root.isEmpty()) {
        root.append(createParagraphNode());
      }

      if (getSelection() !== null) {
        root.selectStart();
      }
    },
    /**
     * Export the content as HTML.
     * @returns {string} HTML.
     */
    $export: () => exportHtml(editor),
    formatName: 'HTML',
  });
};
