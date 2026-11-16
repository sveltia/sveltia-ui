/**
 * Lexical glue for the Shiki engine: turning tokens into code highlight nodes, and refreshing code
 * nodes once an async load has completed.
 *
 * Adapted from Lexical’s `FacadeShiki.ts` (MIT licensed).
 * @see https://github.com/facebook/lexical/tree/v0.50.0/packages/lexical-code-shiki
 */

import {
  $isCodeNode as isCodeNode,
  $createCodeHighlightNode as createCodeHighlightNode,
} from '@lexical/code-core';
import {
  $createLineBreakNode as createLineBreakNode,
  $createTabNode as createTabNode,
  $getNodeByKey as getNodeByKey,
  HISTORY_MERGE_TAG,
  tokenizeRawText,
} from 'lexical';
import { getBackgroundUpdateTags } from '../background-update.js';
import { getTokenStyle, isCodeLanguageLoaded, tokenizeCode } from './engine.js';

/**
 * @import { CodeNode } from '@lexical/code-core';
 * @import { LexicalEditor, LexicalNode, NodeKey } from 'lexical';
 */

/**
 * Mark a code node dirty so the highlighting transform runs again once an async load has completed.
 * @param {LexicalEditor} editor Editor instance.
 * @param {NodeKey} codeNodeKey Key of the code node to refresh.
 */
const refreshCodeNode = (editor, codeNodeKey) => {
  editor.update(
    () => {
      const codeNode = getNodeByKey(codeNodeKey);

      if (!isCodeNode(codeNode)) {
        return;
      }

      const language = codeNode.getLanguage();

      if (language && isCodeLanguageLoaded(language) && !codeNode.getIsSyntaxHighlightSupported()) {
        codeNode.setIsSyntaxHighlightSupported(true);
      }

      codeNode.markDirty();
    },
    { tag: getBackgroundUpdateTags(editor, [HISTORY_MERGE_TAG]) },
  );
};

/**
 * Refresh callbacks created so far, per editor and code node.
 * @type {WeakMap<LexicalEditor, Map<NodeKey, () => void>>}
 */
const refreshers = new WeakMap();

/**
 * Get a function that refreshes the given code node, to pass to the engine’s loaders as the
 * `onLoaded` callback. The same function is returned for the same node, so the engine calls it once
 * per load, however many keystrokes have asked for that load while it was in flight.
 * @param {LexicalEditor} editor Editor instance.
 * @param {NodeKey} codeNodeKey Key of the code node to refresh.
 * @returns {() => void} Refresh function.
 */
export const getCodeNodeRefresher = (editor, codeNodeKey) => {
  let map = refreshers.get(editor);

  if (!map) {
    map = new Map();
    refreshers.set(editor, map);
  }

  let refresher = map.get(codeNodeKey);

  if (!refresher) {
    /** Refresh the code node. */
    refresher = () => {
      refreshCodeNode(editor, codeNodeKey);
    };

    map.set(codeNodeKey, refresher);
  }

  return refresher;
};

/**
 * Convert Shiki tokens to Lexical nodes.
 * @param {any[][]} tokens Tokens, one array per line.
 * @param {boolean} diff Whether the language is a `diff-*` language.
 * @returns {LexicalNode[]} Lexical nodes.
 */
const mapTokensToLexicalStructure = (tokens, diff) => {
  /** @type {LexicalNode[]} */
  const nodes = [];

  tokens.forEach((line, lineIndex) => {
    if (lineIndex) {
      nodes.push(createLineBreakNode());
    }

    line.forEach((token, tokenIndex) => {
      let { content: text } = token;

      // Implement `diff-*` languages
      if (diff && tokenIndex === 0 && text.length > 0) {
        const prefixes = ['+', '-', '>', '<', ' '];
        const prefixTypes = ['inserted', 'deleted', 'inserted', 'deleted', 'unchanged'];
        const prefixIndex = prefixes.indexOf(text[0]);

        if (prefixIndex !== -1) {
          nodes.push(createCodeHighlightNode(prefixes[prefixIndex], prefixTypes[prefixIndex]));
          text = text.slice(1);
        }
      }

      const style = getTokenStyle(token);

      tokenizeRawText(text, {
        /**
         * Append a line break node.
         * @returns {number} New node count.
         */
        linebreak: () => nodes.push(createLineBreakNode()),
        /**
         * Append a tab node.
         * @returns {number} New node count.
         */
        tab: () => nodes.push(createTabNode()),
        /**
         * Create a highlight node carrying the token’s colour.
         * @param {string} part Text fragment.
         */
        text: (part) => {
          const node = createCodeHighlightNode(part);

          node.setStyle(style);
          nodes.push(node);
        },
      });
    });
  });

  return nodes;
};

/**
 * Tokenize a code node’s content into Lexical nodes.
 *
 * Unlike upstream, the theme’s background and foreground colours are not copied onto the code node.
 * The block’s own colours come from `--sui-code-background-color` so that plain and highlighted
 * blocks look alike and follow the app’s theme rather than Shiki’s; only the per-token colours are
 * taken from the theme.
 * @param {CodeNode} codeNode Code node to tokenize.
 * @param {string} language Language identifier.
 * @returns {LexicalNode[]} Lexical nodes.
 */
export const getHighlightNodes = (codeNode, language) => {
  const { tokens, diff } = tokenizeCode(codeNode.getTextContent(), language, codeNode.getTheme());

  return mapTokensToLexicalStructure(tokens, diff);
};
