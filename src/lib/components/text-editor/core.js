import { CodeExtension, CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { registerDragonSupport } from '@lexical/dragon';
import {
  buildEditorFromExtensions,
  HorizontalRuleExtension,
  HorizontalRuleNode,
} from '@lexical/extension';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { registerMarkdownShortcuts } from '@lexical/markdown';
import { registerRichText } from '@lexical/rich-text';
import { TableCellNode, TableExtension, TableNode, TableRowNode } from '@lexical/table';
import { configExtension, defineExtension } from 'lexical';
import { EDITOR_THEME, NODE_MAP, TRANSFORMER_MAP } from './constants.js';
import {
  editorComponents,
  HTML_CODE_IMPORT_MAP,
  HTML_EXPORT_MAP,
  HTML_IMPORT_MAP,
} from './conversion/html.js';
import { registerCodeHighlighting, shikiTokenizer } from './shiki/highlighter.js';
import { getCodeTheme, observeCodeTheme } from './shiki/theme.js';
import { CODE } from './conversion/transformers/code.js';
import { HR } from './conversion/transformers/hr.js';
import { RAW_HTML, RAW_SYNTAX } from './conversion/transformers/raw-syntax.js';
import { $ensureParagraphAfterTable, $normalizeTableHeaders } from './editing/table.js';
import { createTableTransformer } from './conversion/transformers/table.js';
import { limitToSingleLine, registerSingleLine } from './editing/single-line.js';
import { removePlaceholdersFromMatch } from './conversion/editor-components.js';
import {
  registerCodeEditorCommands,
  registerListCommands,
  registerTabIndentation,
} from './editing/commands.js';
import { mergeUnregisters } from './utils.js';
import { registerLinkCommands } from './editing/link.js';
import { registerUpdateEvent } from './conversion/update.js';
import { registerPasteAsMarkdown } from './conversion/paste.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { TextMatchTransformer, Transformer } from '@lexical/markdown';
 * @import {
 * TextEditorComponent,
 * TextEditorConfig,
 * TextEditorNodeType,
 * TextEditorValueFormat,
 * } from '#lib/typedefs.js';
 */

/**
 * @typedef {object} InitEditorResult
 * @property {LexicalEditor} editor Editor instance.
 * @property {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @property {() => void} dispose Remove all registered Lexical listeners.
 */

/**
 * Editor configuration with the defaults applied, and the features derived from it.
 * @typedef {object} EditorSetup
 * @property {TextEditorNodeType[]} enabledButtons Enabled buttons.
 * @property {TextEditorComponent[]} components Editor components.
 * @property {boolean | undefined} useMarkdownShortcuts Whether to enable Markdown shortcuts.
 * @property {boolean} isCodeEditor Whether the editor is a code editor.
 * @property {string} defaultLanguage Default code block language.
 * @property {TextEditorValueFormat} format Value format.
 * @property {boolean} multiline Whether the editor accepts multiple lines.
 * @property {boolean} hasCodeBlock Whether to support code blocks.
 * @property {boolean} hasTable Whether to support table editing.
 * @property {boolean} hasHorizontalRule Whether to support selecting a horizontal rule.
 * @property {boolean} hasBlockSyntax Whether to support horizontal rules and tables in Markdown,
 * even without their buttons.
 */

/**
 * Maximum number of entries in the undo stack.
 */
const HISTORY_MAX_DEPTH = 200;

/**
 * Apply the defaults to the editor configuration, and derive the features from it.
 * @param {TextEditorConfig} config Editor configuration.
 * @returns {EditorSetup} Editor setup.
 */
const getEditorSetup = (config) => {
  const {
    enabledButtons = [],
    components = [],
    useMarkdownShortcuts,
    isCodeEditor = false,
    defaultLanguage = 'plain',
    format = 'markdown',
    multiline = true,
  } = limitToSingleLine(config);

  return {
    enabledButtons,
    components,
    useMarkdownShortcuts,
    isCodeEditor,
    defaultLanguage,
    format,
    multiline,
    hasCodeBlock: enabledButtons.includes('code-block') || isCodeEditor,
    hasTable: enabledButtons.includes('table') && !isCodeEditor,
    hasHorizontalRule: enabledButtons.includes('horizontal-rule') && !isCodeEditor,
    hasBlockSyntax: !isCodeEditor && multiline,
  };
};

/**
 * Get the unique items of a map keyed by button type, for the enabled buttons.
 * @template T
 * @param {Partial<Record<TextEditorNodeType, T[]>>} map Items by button type.
 * @param {TextEditorNodeType[]} enabledButtons Enabled buttons.
 * @returns {T[]} Items.
 */
const pickForButtons = (map, enabledButtons) => [
  ...new Set(
    Object.entries(map)
      .filter(([button]) => enabledButtons.includes(/** @type {TextEditorNodeType} */ (button)))
      .flatMap(([, items]) => /** @type {T[]} */ (items)),
  ),
];

/**
 * Define the Lexical extension the editor is built from, with the nodes and the dependencies the
 * enabled features need.
 * @param {EditorSetup} setup Editor setup.
 * @returns {ReturnType<typeof defineExtension>} Extension.
 */
const createEditorExtension = ({
  enabledButtons,
  components,
  isCodeEditor,
  format,
  hasCodeBlock,
  hasTable,
  hasHorizontalRule,
  hasBlockSyntax,
}) =>
  defineExtension({
    name: '@sveltia/ui/editor',
    namespace: 'editor',
    dependencies: [
      // `CodeNode` expects the editor to be built with `CodeExtension`, which also registers the
      // `CodeNode` and `CodeHighlightNode` nodes
      ...(hasCodeBlock ? [CodeExtension] : []),
      // Table editing: selecting cells, moving between them with the Tab key, and scrolling a wide
      // table. Markdown and the HTML export support neither merged cells nor cell colors
      ...(hasTable
        ? [
            configExtension(TableExtension, {
              hasCellMerge: false,
              hasCellBackgroundColor: false,
              hasHorizontalScroll: true,
              hasTabHandler: true,
            }),
          ]
        : []),
      // Selecting a horizontal rule with a click, so it can be deleted
      ...(hasHorizontalRule ? [HorizontalRuleExtension] : []),
    ],
    // Start with an empty editor state like `createEditor` does, instead of a blank paragraph. The
    // Markdown import then becomes the first state in the history, so undoing right after the
    // editor loads doesn’t revert it to the blank paragraph and clear the value
    $initialEditorState: null,
    nodes: [
      ...components.map(({ node }) => node),
      ...pickForButtons(NODE_MAP, enabledButtons),
      ...(isCodeEditor ? [CodeNode, CodeHighlightNode] : []),
      // We haven’t implemented buttons for horizontal rules and tables yet, but we still want to
      // support them in Markdown, so always include them in the node list, unless the editor is
      // limited to a single line
      ...(hasBlockSyntax ? [HorizontalRuleNode, TableNode, TableCellNode, TableRowNode] : []),
    ],
    theme: EDITOR_THEME,
    // Export clean HTML without the attributes and elements only meant for the editor, and import
    // code blocks with their language. The export map also applies to copying
    html:
      format === 'html'
        ? {
            export: HTML_EXPORT_MAP,
            import: { ...HTML_IMPORT_MAP, ...(hasCodeBlock ? HTML_CODE_IMPORT_MAP : {}) },
          }
        : undefined,
    /**
     * Log an error like `createEditor` does by default, instead of throwing it.
     * @param {Error} error Error.
     */
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

/**
 * Get the Markdown transformers for the enabled features, in the order they have to be applied.
 * @param {EditorSetup} setup Editor setup.
 * @returns {Transformer[]} Transformers.
 */
const getEnabledTransformers = ({ enabledButtons, components, isCodeEditor, hasBlockSyntax }) => {
  const componentTransformers = components.map(({ transformer }) =>
    removePlaceholdersFromMatch(transformer),
  );

  return [
    ...componentTransformers,
    // Raw HTML comes before the editor’s own syntax, so a line of an HTML block that starts like a
    // link, for example, is still raw HTML. Only an editor component takes precedence
    ...(isCodeEditor ? [] : [RAW_HTML]),
    ...pickForButtons(TRANSFORMER_MAP, enabledButtons),
    ...(isCodeEditor ? [CODE] : []),
    // Horizontal rules and tables are always supported in Markdown; see `createEditorExtension()`
    ...(hasBlockSyntax
      ? [
          HR,
          // A table cell can only have inline content, so only the components with a text match
          // transformer can be used there
          createTableTransformer(
            /** @type {TextMatchTransformer[]} */ (
              componentTransformers.filter(({ type }) => type === 'text-match')
            ),
          ),
        ]
      : []),
    // Last, so the syntax of the editor’s own comes first
    ...(isCodeEditor ? [] : [RAW_SYNTAX]),
  ];
};

/**
 * Register the Lexical listeners for the enabled features.
 * @param {LexicalEditor} editor Editor instance.
 * @param {EditorSetup} setup Editor setup.
 * @param {Transformer[]} enabledTransformers Enabled Markdown transformers.
 * @returns {() => void} Function to unregister them all.
 */
const registerEditorListeners = (
  editor,
  {
    enabledButtons,
    useMarkdownShortcuts,
    isCodeEditor,
    defaultLanguage,
    format,
    multiline,
    hasCodeBlock,
    hasTable,
  },
  enabledTransformers,
) =>
  // The order matters, as listeners with the same priority are called in the registration order
  mergeUnregisters(
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
    multiline || isCodeEditor ? undefined : registerSingleLine(editor),
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
    hasTable
      ? editor.registerNodeTransform(TableNode, (table) => {
          $ensureParagraphAfterTable(table);

          // A Markdown table always has a single header row on top, while an HTML table can have
          // any number of them, as well as a header column
          if (format === 'markdown') {
            $normalizeTableHeaders(table);
          }
        })
      : undefined,
    registerListCommands(editor, enabledButtons),
    registerUpdateEvent(editor, enabledTransformers, format),
    registerTabIndentation(editor),
    isCodeEditor ? undefined : registerPasteAsMarkdown(editor, enabledTransformers),
  );

/**
 * Initialize the Lexical editor.
 * @param {TextEditorConfig} config Editor configuration.
 * @returns {InitEditorResult} Editor instance and cleanup.
 */
export const initEditor = (config) => {
  const setup = getEditorSetup(config);
  const enabledTransformers = getEnabledTransformers(setup);
  const editor = buildEditorFromExtensions(createEditorExtension(setup));

  // Let the HTML import tell the elements the components import
  editorComponents.set(editor, setup.components);

  const unregister = registerEditorListeners(editor, setup, enabledTransformers);

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
