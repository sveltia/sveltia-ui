import {
  CodeHighlightNode,
  CodeNode,
  $createCodeNode as createCodeNode,
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
} from '@lexical/code-core';
import { registerDragonSupport } from '@lexical/dragon';
import { HorizontalRuleNode } from '@lexical/extension';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import {
  $isLinkNode as isLinkNode,
  TOGGLE_LINK_COMMAND,
  $toggleLink as toggleLink,
} from '@lexical/link';
import {
  $handleListInsertParagraph as handleListInsertParagraph,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $insertList as insertList,
  $isListItemNode as isListItemNode,
  $isListNode as isListNode,
  ListNode,
} from '@lexical/list';
import {
  CODE,
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  registerMarkdownShortcuts,
} from '@lexical/markdown';
import {
  $isHeadingNode as isHeadingNode,
  $isQuoteNode as isQuoteNode,
  registerRichText,
} from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getNearestNodeOfType as getNearestNodeOfType, objectKlassEquals } from '@lexical/utils';
import { sleep } from '@sveltia/utils/misc';
import { isURL } from '@sveltia/utils/string';
import {
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  createEditor,
  DELETE_CHARACTER_COMMAND,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  ElementNode,
  $getNearestNodeFromDOMNode as getNearestNodeFromDOMNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  $insertNodes as insertNodes,
  $isDecoratorNode as isDecoratorNode,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
  $isTextNode as isTextNode,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  RootNode,
} from 'lexical';
import {
  BLOCK_BUTTON_TYPES,
  DISABLED_MARKDOWN_TAGS,
  EDITOR_THEME,
  NODE_MAP,
  TEXT_FORMAT_BUTTON_TYPES,
  TRANSFORMER_MAP,
} from './constants.js';
import {
  increaseListIndentation,
  padBlankBlockquoteLines,
  splitMultilineFormatting,
  trimBlankBlockquoteLines,
} from './markdown.js';
import {
  isPlainLanguage,
  loadCodeLanguage,
  loadCodeTheme,
  loadEngine,
  normalizeCodeLanguage,
} from './shiki/facade.js';
import { registerCodeHighlighting, shikiTokenizer } from './shiki/highlighter.js';
import { getCodeTheme, observeCodeTheme } from './shiki/theme.js';
import { HR } from './transformers/hr.js';
import { TABLE } from './transformers/table.js';

/**
 * @import { CreateEditorArgs, LexicalEditor } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 * @import {
 * TextEditorBlockType,
 * TextEditorConfig,
 * TextEditorInlineType,
 * TextEditorNodeType,
 * TextEditorSelectionState,
 * } from '$lib/typedefs';
 */

/**
 * @typedef {object} InitEditorResult
 * @property {LexicalEditor} editor Editor instance.
 * @property {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @property {() => void} dispose Remove all registered Lexical listeners.
 */

/**
 * Maximum number of entries in the undo stack.
 */
const HISTORY_MAX_DEPTH = 200;

/**
 * Selector for the elements in a decorator node, like an editor component, that handle a click on
 * their own.
 */
const DECORATOR_INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  // A label moves the focus to its control on click
  'label',
  'summary',
  'video[controls]',
  'audio[controls]',
  '[tabindex]',
  '[draggable="true"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/**
 * Whether a click on the given element would put the caret on the static content of a decorator
 * node, like the label or padding of an editor component. The editor cannot map such a position to
 * a node, so the caret appears there but typing does nothing.
 * @param {EventTarget | null} target Event target.
 * @returns {boolean} Result.
 */
export const isStaticDecoratorContent = (target) => {
  if (!(target instanceof Element)) {
    return false;
  }

  const decorator = target.closest('[data-lexical-decorator]');

  if (!decorator) {
    return false;
  }

  const interactive = target.closest(DECORATOR_INTERACTIVE_SELECTOR);

  // An interactive element outside the decorator is the editor root or one of its ancestors
  return !interactive || !decorator.contains(interactive);
};

/**
 * Move a caret placed directly on the root node into a block: the adjacent paragraph or other
 * block, or a new paragraph if the adjacent nodes are decorators, where nothing can be typed.
 * @returns {boolean} Whether the selection has been moved.
 */
export const $moveCaretIntoBlock = () => {
  const selection = getSelection();

  if (
    !isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    selection.anchor.type !== 'element'
  ) {
    return false;
  }

  const root = getRoot();

  if (!selection.anchor.getNode().is(root)) {
    return false;
  }

  const { offset } = selection.anchor;
  const before = root.getChildAtIndex(offset - 1);
  const after = root.getChildAtIndex(offset);

  if (isElementNode(after)) {
    after.selectStart();
  } else if (isElementNode(before)) {
    before.selectEnd();
  } else {
    const paragraph = createParagraphNode();

    if (before) {
      before.insertAfter(paragraph);
    } else if (after) {
      after.insertBefore(paragraph);
    } else {
      root.append(paragraph);
    }

    paragraph.select();
  }

  return true;
};

/**
 * Move the focus to the editor, and the caret to right after the given decorator node, like an
 * editor component: the start of the next block, or a new paragraph if there’s none to type in.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} decorator Element of the decorator node.
 */
const placeCaretAfterDecorator = (editor, decorator) => {
  editor.getRootElement()?.focus({ preventScroll: true });

  editor.update(() => {
    const node = getNearestNodeFromDOMNode(decorator);

    // The element has been found by its `data-lexical-decorator` attribute
    /* v8 ignore next 3 */
    if (!isDecoratorNode(node)) {
      return;
    }

    node.selectNext();
    $moveCaretIntoBlock();
  });
};

/**
 * Move the focus to the editor, and the caret to the end of the given block.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} block Element of the block node.
 */
const placeCaretAtBlockEnd = (editor, block) => {
  editor.getRootElement()?.focus({ preventScroll: true });

  editor.update(() => {
    const node = getNearestNodeFromDOMNode(block);

    /* v8 ignore next 3 */
    if (!isElementNode(node)) {
      return;
    }

    node.selectEnd();
  });
};

/**
 * Handle a `mousedown` event on the editor, placing the caret where the user expects, rather than
 * leaving it to the browser, when the pointer is not on any editable text. Browsers disagree on
 * where the caret goes in these cases, and some put it within a decorator node, like an editor
 * component, where the editor cannot map it to a node, so typing does nothing:
 *
 * - The static content of a decorator, like its label or padding, places the caret after it.
 * - The empty area of the editor, outside any block, places the caret after the decorator above
 * the pointer, or at the end of the block above the pointer.
 * @param {LexicalEditor} editor Editor instance.
 * @param {MouseEvent} event `mousedown` event.
 * @returns {boolean} Whether the event has been handled.
 */
export const handleEditorMouseDown = (editor, event) => {
  const { target, button, shiftKey, clientY } = event;
  const root = editor.getRootElement();

  // Leave the primary button with Shift, which extends the selection, and other buttons alone.
  // Leave a read-only editor alone as well, as a paragraph may be added, and an event already
  // handled by a nested editor, like one in an editor component
  if (
    !root ||
    !editor.isEditable() ||
    event.defaultPrevented ||
    button !== 0 ||
    shiftKey ||
    !(target instanceof Element)
  ) {
    return false;
  }

  if (isStaticDecoratorContent(target)) {
    const decorator = /** @type {Element} */ (target.closest('[data-lexical-decorator]'));

    // A decorator of a nested editor, like one in an editor component, is handled by that editor
    if (decorator.parentElement?.closest('[data-lexical-editor]') !== root) {
      return false;
    }

    event.preventDefault();
    placeCaretAfterDecorator(editor, decorator);

    return true;
  }

  if (target !== root) {
    return false;
  }

  // Find the last block starting above the pointer. Lexical adds a hidden element to the root
  // after a decorator, which has no size
  const block = [...root.children]
    .filter((element) => !element.hasAttribute('data-lexical-decorator-boundary'))
    .findLast((element) => element.getBoundingClientRect().top <= clientY);

  if (!block) {
    return false;
  }

  if (block.hasAttribute('data-lexical-decorator')) {
    event.preventDefault();
    placeCaretAfterDecorator(editor, block);

    return true;
  }

  // Beside a block, the browser can find the nearest text on its own
  if (clientY <= block.getBoundingClientRect().bottom) {
    return false;
  }

  event.preventDefault();
  placeCaretAtBlockEnd(editor, block);

  return true;
};

/**
 * URL schemes allowed in a link, the same as the ones Lexical renders as is.
 */
const SAFE_LINK_URL_SCHEMES = ['http', 'https', 'mailto', 'sms', 'tel'];

/**
 * Whether the given URL is safe to be used as a link, meaning it’s either relative or uses one of
 * the {@link SAFE_LINK_URL_SCHEMES}. This keeps a URL like `javascript:alert(1)` out of the
 * Markdown, where the site that renders it may not sanitize it.
 * @param {string} url URL.
 * @returns {boolean} Result.
 */
export const isSafeLinkURL = (url) => {
  // Browsers ignore control characters and spaces around a URL as well as tabs and newlines within
  // it, e.g. `java\tscript:`, so strip them all before looking for the scheme
  // eslint-disable-next-line no-control-regex
  const normalizedURL = url.replace(/[\u0000-\u0020]/g, '');

  // Markdown decodes character references and backslash escapes in a link destination, so a scheme
  // can be hidden with them, e.g. `&#106;avascript:`, `javascript&colon;` or `javascript\:`. Reject
  // any of them before the path, query or fragment.
  if (/^[^/?#]*[&\\]/.test(normalizedURL)) {
    return false;
  }

  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(normalizedURL)?.[1];

  return !scheme || SAFE_LINK_URL_SCHEMES.includes(scheme.toLowerCase());
};

/**
 * Get the current selection’s block node key as well as block and inline level types.
 * @internal
 * @returns {TextEditorSelectionState} Current selection state.
 */
export const getSelectionTypes = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return {
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
    };
  }

  const anchor = selection.anchor.getNode();
  /** @type {ElementNode | null} */
  let parent = null;
  /** @type {TextEditorInlineType[]} */
  const inlineTypes = TEXT_FORMAT_BUTTON_TYPES.filter((type) => selection.hasFormat(type));

  if (anchor.getType() !== 'root') {
    parent = anchor instanceof ElementNode ? anchor : getNearestNodeOfType(anchor, ElementNode);

    if (isLinkNode(parent)) {
      inlineTypes.push('link');
      // `getNearestNodeOfType()` would return the link itself, so start from its parent to find the
      // block the link is in
      parent = parent.getParent();
    }

    if (isListItemNode(parent)) {
      parent = getNearestNodeOfType(parent, ListNode);
    }
  }

  const blockType = /** @type {TextEditorBlockType} */ (
    (() => {
      if (!parent) {
        return 'paragraph';
      }

      if (isHeadingNode(parent)) {
        return `heading-${parent.getTag().match(/\d/)?.[0]}`;
      }

      if (isListNode(parent)) {
        return parent.getListType() === 'bullet' ? 'bulleted-list' : 'numbered-list';
      }

      if (isQuoteNode(parent)) {
        return 'blockquote';
      }

      if (isCodeNode(parent) || isCodeHighlightNode(parent)) {
        return 'code-block';
      }

      const type = parent.getType();

      if (BLOCK_BUTTON_TYPES.includes(/** @type {any} */ (type))) {
        return type;
      }

      return 'paragraph';
    })()
  );

  return {
    blockNodeKey: parent?.getKey() ?? null,
    blockType,
    inlineTypes,
  };
};

/**
 * Listen to changes made on the editor and trigger the Update event.
 * @internal
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @param {string} [cachedValue] Markdown value from a previous call, to be reused instead of
 * converting the whole document again when only the selection has changed.
 * @returns {string} Markdown value.
 */
export const onEditorUpdate = (editor, enabledTransformers, cachedValue) => {
  const transformers = enabledTransformers.filter(
    (/** @type {any} */ { tag }) => !DISABLED_MARKDOWN_TAGS.includes(tag),
  );

  const value =
    cachedValue ??
    trimBlankBlockquoteLines(
      convertToMarkdownString(transformers)
        // Remove unnecessary backslash for underscore and backslash characters
        // @see https://github.com/sveltia/sveltia-cms/issues/430
        // @see https://github.com/sveltia/sveltia-cms/issues/512
        .replace(/\\([_\\])/g, '$1')
        // Replace encoded spaces with regular spaces. The HTML entity can appear with a
        // combination of bold and italic text
        // @see https://github.com/sveltia/sveltia-cms/issues/511
        // @see https://github.com/sveltia/sveltia-cms/issues/534
        .replace(/&#32;/g, ' ')
        // Remove the line breaks left by empty paragraphs at the end, which have no content. One
        // may be added just by clicking below a block decorator; see `$moveCaretIntoBlock()`
        .replace(/\n+$/, ''),
    );

  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value,
        selection: getSelectionTypes(),
      },
    }),
  );

  return value;
};

/**
 * Initialize the Lexical editor.
 * @param {TextEditorConfig} config Editor configuration.
 * @returns {InitEditorResult} Editor instance and cleanup.
 */
export const initEditor = ({
  enabledButtons = [],
  components = [],
  useMarkdownShortcuts,
  isCodeEditor = false,
  defaultLanguage = 'plain',
}) => {
  /** @type {CreateEditorArgs} */
  const editorConfig = {
    namespace: 'editor',
    nodes: [
      ...components.map(({ node }) => node),
      ...new Set(
        Object.entries(NODE_MAP)
          .filter(([button]) => enabledButtons.includes(/** @type {TextEditorNodeType} */ (button)))
          .flatMap(([, nodes]) => nodes),
      ),
      ...(isCodeEditor
        ? [CodeNode, CodeHighlightNode]
        : // We haven’t implemented buttons for horizontal rules and tables yet, but we still want
          // to support them in Markdown, so always include them in the node list
          [HorizontalRuleNode, TableNode, TableCellNode, TableRowNode]),
    ],
    theme: EDITOR_THEME,
  };

  /** @type {Transformer[]} */
  const enabledTransformers = [
    ...components.map(({ transformer }) => transformer),
    ...new Set(
      Object.entries(TRANSFORMER_MAP)
        .filter(([button]) => enabledButtons.includes(/** @type {TextEditorNodeType} */ (button)))
        .flatMap(([, transformers]) => transformers),
    ),
    ...(isCodeEditor
      ? [CODE]
      : // See the comment above for why we always include horizontal rules and tables
        [HR, TABLE]),
  ];

  const editor = createEditor(editorConfig);
  /** @type {Array<() => void>} */
  const unregisters = [];

  /**
   * Add a cleanup handler if it is defined.
   * @param {(() => void) | undefined | null} unregister Cleanup handler.
   */
  const addUnregister = (unregister) => {
    /* v8 ignore next */
    if (typeof unregister === 'function') {
      unregisters.push(unregister);
    }
  };

  addUnregister(registerRichText(editor));
  addUnregister(registerDragonSupport(editor));
  // Cap the undo stack, as each entry holds a snapshot of the whole document
  addUnregister(
    registerHistory(
      editor,
      createEmptyHistoryState(),
      1000,
      undefined,
      undefined,
      HISTORY_MAX_DEPTH,
    ),
  );

  if (isCodeEditor) {
    // Pressing Backspace at the very beginning of a code block converts it to a paragraph by
    // default (`CodeNode.collapseAtStart()`), which makes no sense when the editor only holds a
    // single code block, so ignore it
    addUnregister(
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        (isBackward) => {
          const selection = getSelection();

          if (!isBackward || !isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const { offset } = selection.anchor;
          const node = selection.anchor.getNode();
          const codeNode = isCodeNode(node) ? node : getNearestNodeOfType(node, CodeNode);

          return (
            !!codeNode &&
            offset === 0 &&
            (node.is(codeNode) || !!codeNode.getFirstDescendant()?.is(node))
          );
        },
        COMMAND_PRIORITY_LOW,
      ),
    );

    // Make sure the editor always has a single code block. This runs within the same update that
    // made the change, so the user never gets a chance to type in anything else
    addUnregister(
      editor.registerNodeTransform(RootNode, (root) => {
        const children = root.getChildren();

        if (children.length === 1 && isCodeNode(children[0])) {
          return;
        }

        const [firstChild] = children;

        if (children.length === 1 && isElementNode(firstChild)) {
          const node = createCodeNode(defaultLanguage);

          // Keep the content and the selection
          firstChild.replace(node, true);
        } else if (children.length === 0) {
          const node = createCodeNode(defaultLanguage);

          root.append(node);
          node.selectStart();
        }
      }),
    );
  }

  if (useMarkdownShortcuts) {
    addUnregister(registerMarkdownShortcuts(editor, enabledTransformers));
  }

  if (enabledButtons.includes('code-block') || isCodeEditor) {
    addUnregister(
      registerCodeHighlighting(editor, {
        ...shikiTokenizer,
        defaultLanguage,
        defaultTheme: getCodeTheme(),
      }),
    );

    addUnregister(observeCodeTheme(editor));
  }

  // https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/LexicalLinkExtension.ts
  if (enabledButtons.includes('link')) {
    addUnregister(
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload) => {
          // Ignore an unsafe URL rather than linking to it
          if (typeof payload === 'string' && !isSafeLinkURL(payload)) {
            return true;
          }

          toggleLink(typeof payload === 'string' ? payload : null);

          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );

    addUnregister(
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const selection = getSelection();

          if (
            !isRangeSelection(selection) ||
            !objectKlassEquals(event, ClipboardEvent) ||
            !event.clipboardData ||
            /** @type {HTMLElement} */ (event.target).matches('input, textarea')
          ) {
            return false;
          }

          const clipboardText = event.clipboardData.getData('text').trim();

          // Paste an unsafe URL as plain text rather than as a link
          if (!isURL(clipboardText) || !isSafeLinkURL(clipboardText)) {
            return false;
          }

          if (selection.isCollapsed()) {
            insertNodes([createTextNode(clipboardText)]);
          }

          if (
            !selection
              .getNodes()
              .some((node) => isElementNode(node) || (isTextNode(node) && !node.isSimpleText()))
          ) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, clipboardText);
            event.preventDefault();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }

  if (enabledButtons.includes('bulleted-list')) {
    addUnregister(
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          insertList('bullet');

          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }

  if (enabledButtons.includes('numbered-list')) {
    addUnregister(
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => {
          insertList('number');

          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }

  if (enabledButtons.includes('bulleted-list') || enabledButtons.includes('numbered-list')) {
    // https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useList.ts
    addUnregister(
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => handleListInsertParagraph(),
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }

  /** Incremented on every update, so only the latest one in a burst triggers the Update event. */
  let updateCount = 0;
  /** Whether the content has changed since the Update event was last triggered. */
  let contentChanged = true;
  /** @type {string | undefined} */
  let lastValue = undefined;
  let disposed = false;

  addUnregister(() => {
    disposed = true;
  });

  addUnregister(
    editor.registerUpdateListener(({ dirtyElements, dirtyLeaves } = /** @type {any} */ ({})) => {
      // An update that only moves the selection leaves no dirty nodes. Remember whether any update
      // in the burst changed the content, so the document is only converted again when needed.
      // This includes the updates made while composing, which are otherwise skipped.
      contentChanged ||= !dirtyElements || dirtyElements.size > 0 || dirtyLeaves.size > 0;

      if (editor?.isComposing()) {
        return;
      }

      updateCount += 1;

      const currentCount = updateCount;

      (async () => {
        await sleep(100);

        // Skip if a newer update has been made in the meantime, or the editor has been disposed
        if (currentCount !== updateCount || disposed) {
          return;
        }

        editor.update(() => {
          lastValue = onEditorUpdate(
            editor,
            enabledTransformers,
            contentChanged ? undefined : lastValue,
          );
          contentChanged = false;
        });
      })();
    }),
  );

  // `editor.registerCommand(KEY_TAB_COMMAND, listener, priority)` doesn’t work for some reason, so
  // use another method
  addUnregister(
    editor.registerRootListener((root) => {
      if (!root) {
        return undefined;
      }

      /**
       * Handle Tab indentation shortcuts.
       * @param {KeyboardEvent} event Keydown event.
       */
      const onKeydown = (event) => {
        editor.update(() => {
          if (event.key === 'Tab') {
            const selection = getSelection();

            if (!isRangeSelection(selection)) {
              return;
            }

            const anchor = selection.anchor.getNode();

            const parent =
              anchor instanceof ElementNode ? anchor : getNearestNodeOfType(anchor, ElementNode);

            if (isListItemNode(parent) && parent.canIndent()) {
              if (!event.shiftKey) {
                event.preventDefault();
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
              } else if (parent.getIndent() > 0) {
                event.preventDefault();
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              }
            }
          }
        });
      };

      root.addEventListener('keydown', onKeydown);

      return () => {
        root.removeEventListener('keydown', onKeydown);
      };
    }),
  );

  return {
    editor,
    enabledTransformers,
    /**
     * Remove all registered Lexical listeners.
     */
    dispose: () => {
      unregisters.forEach((unregister) => unregister());
    },
  };
};

/**
 * Preload the syntax highlighter for the given programming language.
 *
 * Highlighting also works without this — the transform loads whatever it needs and re-highlights
 * once it arrives — but preloading avoids a visible flash of unhighlighted code.
 * @param {string} lang Language name, like scss.
 */
export const loadCodeHighlighter = async (lang) => {
  if (isPlainLanguage(lang)) {
    return;
  }

  // The grammar and theme loaders are no-ops until the engine is in place
  await loadEngine();

  await Promise.all([loadCodeLanguage(normalizeCodeLanguage(lang)), loadCodeTheme(getCodeTheme())]);
};

/**
 * Convert Markdown to Lexical nodes.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} value Current Markdown value.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @returns {Promise<void>} Nothing.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
export const convertMarkdownToLexical = async (editor, value, enabledTransformers) => {
  // Preload the highlighter for every language used in the document, so code blocks are highlighted
  // as soon as they appear rather than a moment later
  await Promise.all(
    [...value.matchAll(/^```(?<lang>.+?)\n/gm)].map(async ({ groups: { lang = 'plain' } = {} }) =>
      loadCodeHighlighter(lang),
    ),
  );

  // Split multiline formatting into separate lines to prevent Markdown parsing issues
  value = splitMultilineFormatting(value);

  // Increase list indentation levels to prevent Markdown parsing issues
  value = increaseListIndentation(value);

  // Pad blank blockquote lines so they are not imported as literal `>` text
  value = padBlankBlockquoteLines(value);

  return new Promise((resolve, reject) => {
    editor.update(() => {
      try {
        convertFromMarkdownString(value, enabledTransformers);
        resolve(undefined);
      } catch (ex) {
        reject(new Error('Failed to convert Markdown', { cause: ex }));
      }
    });
  });
};

/**
 * Move focus to the editor so the user can start editing immediately.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {Promise<void>} Nothing.
 */
export const focusEditor = async (editor) =>
  new Promise((resolve) => {
    editor.focus(() => {
      resolve(undefined);
    });
  });
