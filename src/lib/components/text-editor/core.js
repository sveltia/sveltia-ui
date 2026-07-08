// Work around the “Prism is not defined” error in consumers
// @see https://github.com/remix-run/remix/discussions/8182
import 'prismjs';

import {
  $createCodeNode as createCodeNode,
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
} from '@lexical/code';
import { PrismTokenizer, registerCodeHighlighting } from '@lexical/code-prism';
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
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { sleep } from '@sveltia/utils/misc';
import {
  COMMAND_PRIORITY_NORMAL,
  createEditor,
  ElementNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  $isRangeSelection as isRangeSelection,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import prismComponents from 'prismjs/components';
import {
  BLOCK_BUTTON_TYPES,
  EDITOR_THEME,
  NODE_MAP,
  PRISM_BASE_URL,
  TEXT_FORMAT_BUTTON_TYPES,
  TRANSFORMER_MAP,
} from './constants.js';
import { increaseListIndentation, splitMultilineFormatting } from './markdown.js';
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
  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value: convertToMarkdownString(enabledTransformers)
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
      HorizontalRuleNode,
      TableNode,
      TableCellNode,
      TableRowNode,
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
    HR,
    TABLE,
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
        defaultLanguage,
        // eslint-disable-next-line jsdoc/require-jsdoc
        tokenize: (code, lang = 'plain') =>
          window.Prism.tokenize(code, window.Prism.languages[lang] ?? window.Prism.languages.plain),
        $tokenize: PrismTokenizer.$tokenize,
      }),
    );
  }

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
 * Load additional Prism syntax highlighter settings for the given programming language.
 * @param {string} lang Language name, like scss.
 */
export const loadCodeHighlighter = async (lang) => {
  if (lang in window.Prism.languages) {
    return;
  }

  const canonicalLang = Object.entries(prismComponents.languages).find(
    // @ts-ignore
    ([key, { alias }]) =>
      key === lang ||
      (Array.isArray(alias) ? alias.includes(lang) : /* v8 ignore next */ alias === lang),
  )?.[0];

  if (!canonicalLang) {
    return;
  }

  try {
    // eslint-disable-next-line jsdoc/no-bad-blocks
    await import(/* @vite-ignore */ `${PRISM_BASE_URL}/components/prism-${canonicalLang}.min.js`);
  } catch {
    //
  }
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
  // Load Prism language support on demand; the `loadLanguages` Prism utility method cannot be used
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
