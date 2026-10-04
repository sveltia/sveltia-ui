import {
  CodeExtension,
  CodeHighlightNode,
  CodeNode,
  $createCodeNode as createCodeNode,
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
} from '@lexical/code-core';
import { registerDragonSupport } from '@lexical/dragon';
import { buildEditorFromExtensions, HorizontalRuleNode } from '@lexical/extension';
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
  defineExtension,
  DELETE_CHARACTER_COMMAND,
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  ElementNode,
  $getNearestNodeFromDOMNode as getNearestNodeFromDOMNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
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
  IMPORT_UPDATE_TAG,
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
 * @import { LexicalEditor, LexicalNode } from 'lexical';
 * @import { ListType } from '@lexical/list';
 * @import { Transformer } from '@lexical/markdown';
 * @import {
 * TextEditorBlockType,
 * TextEditorComponent,
 * TextEditorConfig,
 * TextEditorInlineType,
 * TextEditorNodeType,
 * TextEditorSelectionState,
 * } from '#lib/typedefs.js';
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
const $moveCaretIntoBlock = () => {
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
 * Move the focus to the editor, and run the given function with the node of the given element
 * within an editor update.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} element Element of the node.
 * @param {(node: ReturnType<typeof getNearestNodeFromDOMNode>) => void} callback Function to be
 * called with the node.
 */
const updateNodeWithFocus = (editor, element, callback) => {
  editor.getRootElement()?.focus({ preventScroll: true });

  editor.update(() => {
    callback(getNearestNodeFromDOMNode(element));
  });
};

/**
 * Move the focus to the editor, and the caret to right after the given decorator node, like an
 * editor component: the start of the next block, or a new paragraph if there’s none to type in.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} decorator Element of the decorator node.
 */
const placeCaretAfterDecorator = (editor, decorator) => {
  updateNodeWithFocus(editor, decorator, (node) => {
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
  updateNodeWithFocus(editor, block, (node) => {
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
 * Get the given node itself if it’s an element node, or its nearest element node ancestor.
 * @param {LexicalNode} node Node.
 * @returns {ElementNode | null} Element node.
 */
const getNearestElementNode = (node) =>
  node instanceof ElementNode ? node : getNearestNodeOfType(node, ElementNode);

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
    parent = getNearestElementNode(anchor);

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
 * Convert the editor content to Markdown. Call this within an editor update or read.
 * @internal
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @returns {string} Markdown value.
 */
export const exportMarkdown = (enabledTransformers) => {
  const transformers = enabledTransformers.filter(
    (/** @type {any} */ { tag }) => !DISABLED_MARKDOWN_TAGS.includes(tag),
  );

  return trimBlankBlockquoteLines(
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
  const value = cachedValue ?? exportMarkdown(enabledTransformers);

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
 * Combine the given cleanup handlers into one, which calls them in the given order. Missing
 * handlers, like those of the features that are not enabled, are skipped.
 * @param {...((() => void) | undefined | null)} unregisters Cleanup handlers.
 * @returns {() => void} Combined cleanup handler.
 */
const mergeUnregisters = (...unregisters) => {
  const handlers = unregisters.filter((unregister) => typeof unregister === 'function');

  return () => {
    handlers.forEach((unregister) => unregister());
  };
};

/**
 * Register the commands and transform specific to the code editor, which only holds a single code
 * block.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} defaultLanguage Default language of the code block.
 * @returns {() => void} Cleanup handler.
 */
const registerCodeEditorCommands = (editor, defaultLanguage) =>
  mergeUnregisters(
    // Pressing Backspace at the very beginning of a code block converts it to a paragraph by
    // default (`CodeNode.collapseAtStart()`), which makes no sense when the editor only holds a
    // single code block, so ignore it
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
    // Pressing Enter after two blank lines at the end of a code block exits it by default
    // (`CodeExtension`), adding a paragraph after it, which would be left out of the code. Insert a
    // new line instead, which `CodeNode.insertNewAfter()` does without exiting when the extension
    // is in place. This has to take priority over the extension’s own handler
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = getSelection();

        if (!isRangeSelection(selection)) {
          return false;
        }

        event?.preventDefault();

        return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    // Make sure the editor always has a single code block. This runs within the same update that
    // made the change, so the user never gets a chance to type in anything else
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

/**
 * Register the link command, and the paste handler that turns a pasted URL into a link.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup handler.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/LexicalLinkExtension.ts
 */
const registerLinkCommands = (editor) =>
  mergeUnregisters(
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

/**
 * List buttons, along with the command to insert the list and its type.
 * @type {[TextEditorBlockType, typeof INSERT_UNORDERED_LIST_COMMAND, ListType][]}
 */
const LIST_COMMANDS = [
  ['bulleted-list', INSERT_UNORDERED_LIST_COMMAND, 'bullet'],
  ['numbered-list', INSERT_ORDERED_LIST_COMMAND, 'number'],
];

/**
 * Register the commands for the enabled list buttons.
 * @param {LexicalEditor} editor Editor instance.
 * @param {TextEditorConfig['enabledButtons']} enabledButtons Enabled buttons.
 * @returns {() => void} Cleanup handler.
 */
const registerListCommands = (editor, enabledButtons = []) => {
  const enabledLists = LIST_COMMANDS.filter(([button]) => enabledButtons.includes(button));

  return mergeUnregisters(
    ...enabledLists.map(([, command, listType]) =>
      editor.registerCommand(
        command,
        () => {
          insertList(listType);

          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    ),
    // https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useList.ts
    enabledLists.length
      ? editor.registerCommand(
          INSERT_PARAGRAPH_COMMAND,
          () => handleListInsertParagraph(),
          COMMAND_PRIORITY_NORMAL,
        )
      : undefined,
  );
};

/**
 * Register an update listener that triggers the Update event with the Markdown value, debounced so
 * only the latest update in a burst triggers it.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @returns {() => void} Cleanup handler.
 */
const registerUpdateEvent = (editor, enabledTransformers) => {
  /** Incremented on every update, so only the latest one in a burst triggers the Update event. */
  let updateCount = 0;
  /** Whether the content has changed since the Update event was last triggered. */
  let contentChanged = true;
  /** @type {string | undefined} */
  let lastValue = undefined;
  let disposed = false;

  return mergeUnregisters(
    () => {
      disposed = true;
    },
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
};

/**
 * Register a handler for the Tab key that indents a list item, or unindents it with Shift.
 * `editor.registerCommand(KEY_TAB_COMMAND, listener, priority)` doesn’t work for some reason, so
 * listen to the `keydown` event on the root element instead.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup handler.
 */
const registerTabIndentation = (editor) =>
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

          const parent = getNearestElementNode(selection.anchor.getNode());

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
  });

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
  const hasCodeBlock = enabledButtons.includes('code-block') || isCodeEditor;

  const editorExtension = defineExtension({
    name: '@sveltia/ui/editor',
    namespace: 'editor',
    // `CodeNode` expects the editor to be built with `CodeExtension`, which also registers the
    // `CodeNode` and `CodeHighlightNode` nodes
    dependencies: hasCodeBlock ? [CodeExtension] : [],
    // Start with an empty editor state like `createEditor` does, instead of a blank paragraph. The
    // Markdown import then becomes the first state in the history, so undoing right after the
    // editor loads doesn’t revert it to the blank paragraph and clear the value
    $initialEditorState: null,
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
    /**
     * Log an error like `createEditor` does by default, instead of throwing it.
     * @param {Error} error Error.
     */
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

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

  const editor = buildEditorFromExtensions(editorExtension);

  // The order matters, as listeners with the same priority are called in the registration order
  const unregister = mergeUnregisters(
    registerRichText(editor),
    registerDragonSupport(editor),
    // Cap the undo stack, as each entry holds a snapshot of the whole document
    registerHistory(
      editor,
      createEmptyHistoryState(),
      1000,
      undefined,
      undefined,
      HISTORY_MAX_DEPTH,
    ),
    isCodeEditor ? registerCodeEditorCommands(editor, defaultLanguage) : undefined,
    useMarkdownShortcuts ? registerMarkdownShortcuts(editor, enabledTransformers) : undefined,
    hasCodeBlock
      ? registerCodeHighlighting(editor, {
          ...shikiTokenizer,
          defaultLanguage,
          defaultTheme: getCodeTheme(),
        })
      : undefined,
    hasCodeBlock ? observeCodeTheme(editor) : undefined,
    enabledButtons.includes('link') ? registerLinkCommands(editor) : undefined,
    registerListCommands(editor, enabledButtons),
    registerUpdateEvent(editor, enabledTransformers),
    registerTabIndentation(editor),
  );

  return {
    editor,
    enabledTransformers,
    /**
     * Remove all registered Lexical listeners.
     */
    dispose: () => {
      unregister();
      editor.dispose();
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
 * Number of the latest Markdown import started for each editor.
 * @type {WeakMap<LexicalEditor, number>}
 */
const latestImports = new WeakMap();

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
    await Promise.all(
      [...value.matchAll(/^```(?<lang>.+?)\n/gm)].map(async ({ groups: { lang = 'plain' } = {} }) =>
        loadCodeHighlighter(lang),
      ),
    );
  } catch (ex) {
    if (isSuperseded()) {
      return undefined;
    }

    throw ex;
  }

  if (isSuperseded()) {
    return undefined;
  }

  // Split multiline formatting into separate lines to prevent Markdown parsing issues
  value = splitMultilineFormatting(value);

  // Increase list indentation levels to prevent Markdown parsing issues
  value = increaseListIndentation(value);

  // Pad blank blockquote lines so they are not imported as literal `>` text
  value = padBlankBlockquoteLines(value);

  /** @type {unknown} */
  let error;

  editor.update(
    () => {
      try {
        convertFromMarkdownString(value, enabledTransformers);
      } catch (ex) {
        error = ex;
      }
    },
    // Tell the import from a change made by the user, and commit it right away, so the node
    // transforms, e.g. the one giving a code block its default language, have run by the time the
    // content is exported below
    { tag: IMPORT_UPDATE_TAG, discrete: true },
  );

  if (error) {
    throw new Error('Failed to convert Markdown', { cause: error });
  }

  return editor.read(() => exportMarkdown(enabledTransformers));
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
