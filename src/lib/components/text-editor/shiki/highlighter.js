/**
 * Lexical node transforms that keep code blocks syntax highlighted.
 *
 * Adapted from Lexical’s `CodeHighlighterShiki.ts` (MIT licensed). The transform logic is copied
 * as-is; only the highlighting back end differs, because upstream imports its Shiki facade directly
 * and offers no way to substitute one that loads grammars on demand.
 * @see https://github.com/facebook/lexical/blob/v0.49.0/packages/lexical-code-shiki/src/CodeHighlighterShiki.ts
 * @see https://github.com/sveltia/sveltia-cms/issues/587
 *
 * The extension APIs (`CodeShikiExtension`, `CodeHighlighterShikiExtension`) are intentionally left
 * out, since this library registers the transforms directly.
 */

import {
  CodeHighlightNode,
  CodeNode,
  DEFAULT_CODE_LANGUAGE,
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
  $plainifyCodeContent as plainifyCodeContent,
  registerCodeIndentation,
} from '@lexical/code-core';
import { mergeRegister } from '@lexical/utils';
import {
  $createTextNode as createTextNode,
  $getNodeByKey as getNodeByKey,
  $getSelection as getSelection,
  $isLineBreakNode as isLineBreakNode,
  $isRangeSelection as isRangeSelection,
  $isTabNode as isTabNode,
  $isTextNode as isTextNode,
  $onUpdate as onUpdate,
  HISTORY_MERGE_TAG,
  TextNode,
} from 'lexical';
import {
  getHighlightNodes,
  isCodeLanguageLoaded,
  isCodeThemeLoaded,
  isEngineLoaded,
  isEngineUnavailable,
  isPlainLanguage,
  loadCodeLanguage,
  loadCodeTheme,
  loadEngine,
} from './facade.js';

/**
 * @import { CodeNode as CodeNodeType } from '@lexical/code-core';
 * @import { LexicalEditor, LexicalNode, NodeKey } from 'lexical';
 * @import { CodeTokenizer, CodeTransformState } from '$lib/typedefs';
 */

const DEFAULT_CODE_THEME = 'github-light';

/**
 * Default tokenizer backed by Shiki.
 *
 * Falls back to unhighlighted text whenever highlighting is impossible — a plain language, or an
 * engine that has not loaded yet or could not be fetched — so a code block always renders.
 * @type {CodeTokenizer}
 */
export const shikiTokenizer = {
  defaultLanguage: DEFAULT_CODE_LANGUAGE,
  defaultTheme: DEFAULT_CODE_THEME,
  /**
   * Convert a code node’s content into Lexical nodes.
   * @param {CodeNodeType} codeNode Code node to tokenize.
   * @param {string} [language] Language identifier.
   * @returns {LexicalNode[]} Lexical nodes.
   */
  tokenize(codeNode, language) {
    const lang = language || this.defaultLanguage;

    if (lang === null || isPlainLanguage(lang) || !isEngineLoaded()) {
      return plainifyCodeContent(codeNode.getTextContent());
    }

    return getHighlightNodes(codeNode, lang);
  },
};

/**
 * Update the line number gutter of a code block.
 * @param {CodeNodeType} node Code node.
 * @param {LexicalEditor} editor Editor instance.
 */
const updateCodeGutter = (node, editor) => {
  const codeElement = editor.getElementByKey(node.getKey());

  if (codeElement === null) {
    return;
  }

  const children = node.getChildren();
  const childrenLength = children.length;

  // @ts-ignore Internal field
  if (childrenLength === codeElement.__cachedChildrenLength) {
    // Avoid updating the attribute if the children length hasn’t changed
    return;
  }

  // @ts-ignore Internal field
  codeElement.__cachedChildrenLength = childrenLength;

  let gutter = '1';
  let count = 1;

  for (let i = 0; i < childrenLength; i += 1) {
    if (isLineBreakNode(children[i])) {
      count += 1;
      gutter += `\n${count}`;
    }
  }

  codeElement.setAttribute('data-gutter', gutter);
};

/**
 * Compare two nodes for the purpose of diffing highlight output. Only code highlight nodes, tabs
 * and line breaks are considered equal; a regular text node always compares unequal so that it gets
 * transformed into a code highlight node.
 * @param {LexicalNode} nodeA First node.
 * @param {LexicalNode} nodeB Second node.
 * @returns {boolean} Result.
 */
const isEqual = (nodeA, nodeB) =>
  (isCodeHighlightNode(nodeA) &&
    isCodeHighlightNode(nodeB) &&
    // @ts-ignore Internal fields
    nodeA.__text === nodeB.__text &&
    // @ts-ignore Internal fields
    nodeA.__highlightType === nodeB.__highlightType &&
    // @ts-ignore Internal fields
    nodeA.__style === nodeB.__style) ||
  (isTabNode(nodeA) && isTabNode(nodeB)) ||
  (isLineBreakNode(nodeA) && isLineBreakNode(nodeB));

/**
 * Find the minimal diff range between two node lists.
 * @param {LexicalNode[]} prevNodes Current nodes.
 * @param {LexicalNode[]} nextNodes Desired nodes.
 * @returns {{ from: number, to: number, nodesForReplacement: LexicalNode[] }} Boundaries of
 * `prevNodes` to replace, and the replacement nodes.
 */
const getDiffRange = (prevNodes, nextNodes) => {
  let leadingMatch = 0;

  while (leadingMatch < prevNodes.length) {
    if (!isEqual(prevNodes[leadingMatch], nextNodes[leadingMatch])) {
      break;
    }

    leadingMatch += 1;
  }

  const prevNodesLength = prevNodes.length;
  const nextNodesLength = nextNodes.length;
  const maxTrailingMatch = Math.min(prevNodesLength, nextNodesLength) - leadingMatch;
  let trailingMatch = 0;

  while (trailingMatch < maxTrailingMatch) {
    trailingMatch += 1;

    if (
      !isEqual(
        prevNodes[prevNodesLength - trailingMatch],
        nextNodes[nextNodesLength - trailingMatch],
      )
    ) {
      trailingMatch -= 1;
      break;
    }
  }

  return {
    from: leadingMatch,
    to: prevNodesLength - trailingMatch,
    nodesForReplacement: nextNodes.slice(leadingMatch, nextNodesLength - trailingMatch),
  };
};

/**
 * Run an update while trying to keep the cursor where it was.
 * @param {NodeKey} nodeKey Key of the code node being updated.
 * @param {() => boolean} updateFn Update to run. Should return whether anything changed.
 */
const updateAndRetainSelection = (nodeKey, updateFn) => {
  const node = getNodeByKey(nodeKey);

  if (!isCodeNode(node) || !node.isAttached()) {
    return;
  }

  const selection = getSelection();

  // If it’s not a range selection there’s no need to change it, but we can still run the
  // highlighting logic
  if (!isRangeSelection(selection)) {
    updateFn();

    return;
  }

  const { anchor } = selection;
  const anchorOffset = anchor.offset;

  const isNewLineAnchor =
    anchor.type === 'element' && isLineBreakNode(node.getChildAtIndex(anchor.offset - 1));

  let textOffset = 0;

  // Calculate the previous text offset: all text nodes prior to the anchor, plus the anchor’s own
  // text offset
  if (!isNewLineAnchor) {
    const anchorNode = anchor.getNode();

    textOffset =
      anchorOffset +
      anchorNode
        .getPreviousSiblings()
        .reduce((offset, node_) => offset + node_.getTextContentSize(), 0);
  }

  if (!updateFn()) {
    return;
  }

  // Non-text anchors only happen for line breaks, otherwise the selection will be within a text
  // node
  if (isNewLineAnchor) {
    anchor.getNode().select(anchorOffset, anchorOffset);

    return;
  }

  // If it was a non-element anchor, walk through the child nodes looking for the position of the
  // original text offset
  node.getChildren().some((node_) => {
    const isText = isTextNode(node_);

    if (isText || isLineBreakNode(node_)) {
      const textContentSize = node_.getTextContentSize();

      if (isText && textContentSize >= textOffset) {
        node_.select(textOffset, textOffset);

        return true;
      }

      textOffset -= textContentSize;
    }

    return false;
  });
};

/**
 * Re-highlight a code node.
 * @param {LexicalEditor} editor Editor instance.
 * @param {CodeTokenizer} tokenizer Tokenizer.
 * @param {CodeTransformState} transformState Shared transform state.
 * @param {CodeNodeType} node Code node to transform.
 */
const codeNodeTransform = (editor, tokenizer, transformState, node) => {
  const nodeKey = node.getKey();
  const { nodesCurrentlyHighlighting } = transformState;
  // A newly inserted code block might not have a language yet. A tokenizer configured with
  // `defaultLanguage: null` opts out of the implicit fallback, so that Markdown round-trips ```
  // with no info string.
  let language = node.getLanguage();

  if (!language && tokenizer.defaultLanguage !== null) {
    language = tokenizer.defaultLanguage;
    node.setLanguage(language);
  }

  let theme = node.getTheme();

  if (!theme) {
    theme = tokenizer.defaultTheme;
    node.setTheme(theme);
  }

  // Plain text needs no engine, grammar or theme, so it is highlighted — that is, rendered verbatim
  // — without a single network request. This is the common case: it is the default for a new block.
  const isPlain = !language || isPlainLanguage(language);
  let inFlight = false;

  // `!language` is redundant with `isPlain`, but it lets the type checker narrow `language` to a
  // string in the branches below
  if (isPlain || !language || isEngineUnavailable()) {
    if (node.getIsSyntaxHighlightSupported()) {
      node.setIsSyntaxHighlightSupported(false);
    }
  } else if (!isEngineLoaded()) {
    // Dynamic load of the engine itself
    loadEngine(editor, nodeKey);
    inFlight = true;
  } else {
    // Dynamic load of themes
    if (!isCodeThemeLoaded(theme)) {
      loadCodeTheme(theme, editor, nodeKey);
      inFlight = true;
    }

    // Dynamic load of languages
    if (isCodeLanguageLoaded(language)) {
      if (!node.getIsSyntaxHighlightSupported()) {
        node.setIsSyntaxHighlightSupported(true);
      }
    } else {
      const loadingTask = loadCodeLanguage(language, editor, nodeKey);

      // If the language is not supported, no download will occur
      if (!loadingTask && node.getIsSyntaxHighlightSupported()) {
        node.setIsSyntaxHighlightSupported(false);
      }

      inFlight = true;
    }
  }

  if (inFlight) {
    return;
  }

  if (nodesCurrentlyHighlighting.has(nodeKey)) {
    // Upstream drops this edit, which loses the last keystroke of a fast burst. Schedule one
    // re-highlight for after the in-progress pass settles instead, deduplicated per node so a
    // burst does not queue an update each.
    if (!transformState.pendingRefresh.has(nodeKey)) {
      transformState.pendingRefresh.add(nodeKey);

      onUpdate(() => {
        transformState.pendingRefresh.delete(nodeKey);

        editor.update(
          () => {
            const staleNode = getNodeByKey(nodeKey);

            if (isCodeNode(staleNode)) {
              staleNode.markDirty();
            }
          },
          { tag: HISTORY_MERGE_TAG },
        );
      });
    }

    return;
  }

  nodesCurrentlyHighlighting.add(nodeKey);

  if (!transformState.didTransform) {
    transformState.didTransform = true;

    onUpdate(() => {
      transformState.didTransform = false;
      nodesCurrentlyHighlighting.clear();
    });
  }

  updateAndRetainSelection(nodeKey, () => {
    const currentNode = getNodeByKey(nodeKey);

    if (!isCodeNode(currentNode) || !currentNode.isAttached()) {
      return false;
    }

    const lang = currentNode.getLanguage() || tokenizer.defaultLanguage;
    const highlightNodes = tokenizer.tokenize(currentNode, lang ?? undefined);

    const { from, to, nodesForReplacement } = getDiffRange(
      currentNode.getChildren(),
      highlightNodes,
    );

    if (from !== to || nodesForReplacement.length) {
      node.splice(from, to - from, nodesForReplacement);

      return true;
    }

    return false;
  });
};

/**
 * Re-highlight the code block a text node belongs to.
 * @param {LexicalEditor} editor Editor instance.
 * @param {CodeTokenizer} tokenizer Tokenizer.
 * @param {CodeTransformState} transformState Shared transform state.
 * @param {TextNode} node Text node that changed.
 */
const textNodeTransform = (editor, tokenizer, transformState, node) => {
  // `CodeNode` has a flat children structure, so we only need to check whether the node’s parent is
  // a code node and run highlighting if so
  const parentNode = node.getParent();

  if (isCodeNode(parentNode)) {
    codeNodeTransform(editor, tokenizer, transformState, parentNode);
  } else if (isCodeHighlightNode(node)) {
    // When a code block is converted into a paragraph or other element, code highlight nodes are
    // converted back to normal text
    // @ts-ignore Internal field
    node.replace(createTextNode(node.__text));
  }
};

/**
 * Register syntax highlighting, along with the indentation and arrow key handlers.
 * @param {LexicalEditor} editor Editor instance.
 * @param {CodeTokenizer} [tokenizer] Tokenizer to use.
 * @returns {() => void} Cleanup function.
 * @throws {Error} When the required nodes are not registered on the editor.
 */
export const registerCodeHighlighting = (editor, tokenizer = shikiTokenizer) => {
  if (!editor.hasNodes([CodeNode, CodeHighlightNode])) {
    throw new Error('CodeNode or CodeHighlightNode not registered on editor');
  }

  /** @type {Array<() => void>} */
  const registrations = [];

  // Only register the mutation listener if not in headless mode
  /* v8 ignore next 18 */
  // @ts-ignore Internal field
  if (editor._headless !== true) {
    registrations.push(
      editor.registerMutationListener(
        CodeNode,
        (mutations) => {
          editor.read('latest', () => {
            mutations.forEach((type, key) => {
              if (type !== 'destroyed') {
                const node = getNodeByKey(key);

                if (node !== null) {
                  updateCodeGutter(/** @type {CodeNodeType} */ (node), editor);
                }
              }
            });
          });
        },
        { skipInitialization: false },
      ),
    );
  }

  /** @type {CodeTransformState} */
  const transformState = {
    didTransform: false,
    nodesCurrentlyHighlighting: new Set(),
    pendingRefresh: new Set(),
  };

  registrations.push(
    editor.registerNodeTransform(
      CodeNode,
      codeNodeTransform.bind(null, editor, tokenizer, transformState),
    ),
    editor.registerNodeTransform(
      TextNode,
      textNodeTransform.bind(null, editor, tokenizer, transformState),
    ),
    editor.registerNodeTransform(
      CodeHighlightNode,
      textNodeTransform.bind(null, editor, tokenizer, transformState),
    ),
    registerCodeIndentation(editor),
  );

  return mergeRegister(...registrations);
};
