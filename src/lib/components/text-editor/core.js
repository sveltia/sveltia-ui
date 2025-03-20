import {
  CodeHighlightNode,
  CodeNode,
  $createCodeNode as createCodeNode,
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
  registerCodeHighlighting,
} from '@lexical/code';
import { registerDragonSupport } from '@lexical/dragon';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import {
  LinkNode,
  TOGGLE_LINK_COMMAND,
  $isLinkNode as isLinkNode,
  $toggleLink as toggleLink,
} from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  $handleListInsertParagraph as handleListInsertParagraph,
  $insertList as insertList,
  $isListItemNode as isListItemNode,
  $isListNode as isListNode,
} from '@lexical/list';
import {
  TRANSFORMERS,
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
} from '@lexical/markdown';
import {
  HeadingNode,
  QuoteNode,
  $isHeadingNode as isHeadingNode,
  $isQuoteNode as isQuoteNode,
  registerRichText,
} from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { sleep } from '@sveltia/utils/misc';
import {
  COMMAND_PRIORITY_NORMAL,
  ElementNode,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  createEditor,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import prismComponents from 'prismjs/components';
import { blockButtonTypes, textFormatButtonTypes } from '.';
import { TABLE } from './transformers/table';

/**
 * @import { CreateEditorArgs, LexicalEditor } from 'lexical';
 * @import {
 * TextEditorBlockType,
 * TextEditorConfig,
 * TextEditorInlineType,
 * TextEditorSelectionState,
 * } from '$lib/typedefs';
 */

const allTransformers = [...TRANSFORMERS, TABLE];
const prismBaseURL = `https://unpkg.com/prismjs@1.30.0`;

/**
 * Lexical editor configuration.
 * @type {CreateEditorArgs}
 */
const editorConfig = {
  namespace: 'editor',
  nodes: [
    HeadingNode,
    QuoteNode,
    LinkNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
  theme: {
    text: {
      /**
       * Enable bold+italic styling.
       * @see https://github.com/facebook/lexical/discussions/4381
       */
      italic: 'italic',
    },
    list: {
      nested: {
        listitem: 'nested',
      },
    },
    code: 'code-block',
    // https://github.com/facebook/lexical/blob/main/packages/lexical-website/docs/getting-started/theming.md
    codeHighlight: {
      atrule: 'token atrule',
      attr: 'token attr',
      boolean: 'token boolean',
      builtin: 'token builtin',
      cdata: 'token cdata',
      char: 'token char',
      class: 'token class',
      'class-name': 'token class-name',
      comment: 'token comment',
      constant: 'token constant',
      deleted: 'token deleted',
      doctype: 'token doctype',
      entity: 'token entity',
      function: 'token function',
      important: 'token important',
      inserted: 'token inserted',
      keyword: 'token keyword',
      namespace: 'token namespace',
      number: 'token number',
      operator: 'token operator',
      prolog: 'token prolog',
      property: 'token property',
      punctuation: 'token punctuation',
      regex: 'token regex',
      selector: 'token selector',
      string: 'token string',
      symbol: 'token symbol',
      tag: 'token tag',
      url: 'token url',
      variable: 'token variable',
    },
  },
};

/**
 * Get the current selection’s block node key as well as block and inline level types.
 * @returns {TextEditorSelectionState} Current selection state.
 */
const getSelectionTypes = () => {
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
  const inlineTypes = textFormatButtonTypes.filter((type) => selection.hasFormat(type));

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

      if (blockButtonTypes.includes(/** @type {any} */ (type))) {
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
 * @param {LexicalEditor} editor Editor instance.
 */
const onEditorUpdate = (editor) => {
  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value: convertToMarkdownString(
          // Use underscores for italic text in Markdown instead of asterisks
          allTransformers.filter((/** @type {any} */ { tag }) => tag !== '*'),
        ),
        selection: getSelectionTypes(),
      },
    }),
  );
};

/**
 * Initialize the Lexical editor.
 * @param {TextEditorConfig} config Editor configuration.
 * @returns {LexicalEditor} Editor instance.
 */
export const initEditor = ({ components = [], isCodeEditor = false, defaultLanguage = '' }) => {
  components.forEach(({ node, transformer }) => {
    /** @type {any[]} */ (editorConfig.nodes).unshift(node);
    allTransformers.unshift(transformer);
  });

  const editor = createEditor(editorConfig);

  registerRichText(editor);
  registerDragonSupport(editor);
  registerHistory(editor, createEmptyHistoryState(), 1000);

  registerCodeHighlighting(editor, {
    defaultLanguage,
    // eslint-disable-next-line jsdoc/require-jsdoc
    tokenize: (code, lang = 'plain') =>
      window.Prism.tokenize(code, window.Prism.languages[lang] ?? window.Prism.languages.plain),
  });

  editor.registerCommand(
    TOGGLE_LINK_COMMAND,
    (payload) => {
      toggleLink(typeof payload === 'string' ? payload : null);

      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerCommand(
    INSERT_UNORDERED_LIST_COMMAND,
    () => {
      insertList('bullet');

      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerCommand(
    INSERT_ORDERED_LIST_COMMAND,
    () => {
      insertList('number');

      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  // https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useList.ts
  editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => handleListInsertParagraph(),
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerUpdateListener(async () => {
    if (editor?.isComposing()) {
      return;
    }

    await sleep(100);

    editor.update(() => {
      // Prevent CodeNode from being removed
      if (isCodeEditor) {
        const root = getRoot();
        const children = root.getChildren();

        if (children.length === 1 && !isCodeNode(children[0])) {
          children[0].remove();
        }

        if (children.length === 0) {
          const node = createCodeNode();

          node.setLanguage(defaultLanguage);
          root.append(node);
        }
      }

      onEditorUpdate(editor);
    });
  });

  // `editor.registerCommand(KEY_TAB_COMMAND, listener, priority)` doesn’t work for some reason, so
  // use another method
  editor.registerRootListener((root) => {
    if (root) {
      root.addEventListener('keydown', (event) => {
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
      });
    }
  });

  return editor;
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
      key === lang || (Array.isArray(alias) ? alias.includes(lang) : alias === lang),
  )?.[0];

  if (!canonicalLang) {
    return;
  }

  try {
    // eslint-disable-next-line jsdoc/no-bad-blocks
    await import(/* @vite-ignore */ `${prismBaseURL}/components/prism-${canonicalLang}.min.js`);
  } catch {
    //
  }
};

/**
 * Convert Markdown to Lexical nodes.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} value Current Markdown value.
 * @returns {Promise<void>} Nothing.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
export const convertMarkdownToLexical = async (editor, value) => {
  // Load Prism language support on demand; the `loadLanguages` Prism utility method cannot be used
  await Promise.all(
    [...value.matchAll(/^```(?<lang>.+?)\n/gm)].map(async ({ groups: { lang } = {} }) =>
      loadCodeHighlighter(lang),
    ),
  );

  return new Promise((resolve, reject) => {
    editor.update(() => {
      try {
        convertFromMarkdownString(value, allTransformers);
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
export const focusEditor = async (editor) => {
  await sleep(100);
  editor.getRootElement()?.focus();

  return new Promise((resolve) => {
    editor.focus(async () => {
      await sleep(100);
      resolve(undefined);
    });
  });
};
