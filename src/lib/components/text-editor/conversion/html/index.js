/**
 * HTML import and export of the rich text editor.
 */

import { exportHtml, HTML_EXPORT_MAP } from './export.js';
import { getCodeLanguage, HTML_CODE_IMPORT_MAP, HTML_IMPORT_MAP } from './import-rules.js';
import { HTML_TASK_LIST_IMPORT_MAP } from './task-list.js';

/**
 * @import { HTMLConfig } from 'lexical';
 */

export { editorComponents } from './components.js';
export { findUnsupportedNode } from './unsupported.js';
export { exportHtml, getCodeLanguage };

/**
 * Get the HTML configuration of an editor for the HTML format: the export map, which also applies
 * to copying, to export clean HTML without the attributes and elements only meant for the editor,
 * and the import rules for the enabled features, like code blocks with their language.
 * @param {object} features Enabled features.
 * @param {boolean} features.hasCodeBlock Whether code blocks are supported.
 * @param {boolean} features.hasTaskList Whether task lists are supported.
 * @returns {HTMLConfig} Configuration.
 */
export const getHtmlConfig = ({ hasCodeBlock, hasTaskList }) => ({
  export: HTML_EXPORT_MAP,
  import: {
    ...HTML_IMPORT_MAP,
    ...(hasCodeBlock ? HTML_CODE_IMPORT_MAP : {}),
    ...(hasTaskList ? HTML_TASK_LIST_IMPORT_MAP : {}),
  },
});
