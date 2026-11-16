/**
 * The editor configuration: its defaults, and the features derived from it.
 */

import { limitToSingleLine } from './editing/single-line.js';

/**
 * @import {
 * TextEditorComponent,
 * TextEditorConfig,
 * TextEditorNodeType,
 * TextEditorValueFormat,
 * } from '#lib/typedefs.js';
 */

/**
 * Editor configuration with the defaults applied.
 * @typedef {TextEditorConfig & {
 * useEmojiAutocomplete: boolean,
 * defaultLanguage: string,
 * format: TextEditorValueFormat,
 * multiline: boolean,
 * }} NormalizedEditorConfig
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
 * @property {boolean} hasLink Whether to support links.
 * @property {boolean} hasTaskList Whether to support task lists.
 * @property {boolean} hasBlockSyntax Whether to support horizontal rules and tables in Markdown,
 * even without their buttons.
 */

/**
 * Apply the defaults to the editor configuration, and limit it to the inline features if the editor
 * is limited to a single line. Normalizing a configuration again gives an equal one.
 * @param {Partial<TextEditorConfig>} config Editor configuration.
 * @returns {NormalizedEditorConfig} Normalized configuration.
 */
export const normalizeConfig = ({
  modes = [],
  enabledButtons = [],
  components = [],
  isCodeEditor = false,
  useEmojiAutocomplete = false,
  defaultLanguage = 'plain',
  format = 'markdown',
  multiline = true,
  ...rest
}) =>
  /** @type {NormalizedEditorConfig} */ (
    limitToSingleLine({
      ...rest,
      // The store always gives one; a configuration without one has no Markdown shortcuts
      useMarkdownShortcuts: /** @type {boolean} */ (rest.useMarkdownShortcuts),
      modes,
      enabledButtons,
      components,
      isCodeEditor,
      useEmojiAutocomplete,
      defaultLanguage,
      format,
      multiline,
    })
  );

/**
 * Derive the features from the editor configuration.
 * @param {NormalizedEditorConfig} config Editor configuration normalized with
 * {@link normalizeConfig}, like the one the editor store holds.
 * @returns {EditorSetup} Editor setup.
 */
export const getEditorSetup = (config) => {
  const {
    enabledButtons,
    components,
    useMarkdownShortcuts,
    isCodeEditor,
    defaultLanguage,
    format,
    multiline,
  } = config;

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
    hasLink: enabledButtons.includes('link'),
    hasTaskList: enabledButtons.includes('task-list'),
    hasBlockSyntax: !isCodeEditor && multiline,
  };
};
