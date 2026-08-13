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
  $createTextNode as createTextNode,
  ElementNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  $insertNodes as insertNodes,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
  $isTextNode as isTextNode,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
} from 'lexical';
import {
  BLOCK_BUTTON_TYPES,
  DISABLED_MARKDOWN_TAGS,
  EDITOR_THEME,
  NODE_MAP,
  TEXT_FORMAT_BUTTON_TYPES,
  TRANSFORMER_MAP,
} from './constants.js';
import { increaseListIndentation, splitMultilineFormatting } from './markdown.js';
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
      parent = getNearestNodeOfType(parent, ElementNode);
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
 */
export const onEditorUpdate = (editor, enabledTransformers) => {
  const transformers = enabledTransformers.filter(
    (/** @type {any} */ { tag }) => !DISABLED_MARKDOWN_TAGS.includes(tag),
  );

  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value: convertToMarkdownString(transformers)
          // Remove unnecessary backslash for underscore and backslash characters
          // @see https://github.com/sveltia/sveltia-cms/issues/430
          // @see https://github.com/sveltia/sveltia-cms/issues/512
          .replace(/\\([_\\])/g, '$1')
          // Replace encoded spaces with regular spaces. The HTML entity can appear with a
          // combination of bold and italic text
          // @see https://github.com/sveltia/sveltia-cms/issues/511
          // @see https://github.com/sveltia/sveltia-cms/issues/534
          .replace(/&#32;/g, ' '),
        selection: getSelectionTypes(),
      },
    }),
  );
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
  addUnregister(registerHistory(editor, createEmptyHistoryState(), 1000));

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

          if (!isURL(clipboardText)) {
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

  addUnregister(
    editor.registerUpdateListener(() => {
      if (editor?.isComposing()) {
        return;
      }

      (async () => {
        await sleep(100);

        editor.update(() => {
          // Prevent CodeNode from being removed
          /* v8 ignore next */
          if (isCodeEditor) {
            const root = getRoot();
            const children = root.getChildren();

            // c8 ignore next 3
            if (children.length === 1 && !isCodeNode(children[0])) {
              children[0].remove();
            }

            if (children.length === 0) {
              const node = createCodeNode();

              node.setLanguage(defaultLanguage);
              root.append(node);
            }
          }

          onEditorUpdate(editor, enabledTransformers);
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
