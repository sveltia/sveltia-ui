import { CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { LinkNode } from '@lexical/link';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { createCommand } from 'lexical';

import { CODE } from './conversion/transformers/code.js';
import { LEADING_INLINE_CODE } from './conversion/transformers/inline-code.js';
import { LINK } from './conversion/transformers/link.js';
import { TASK_LIST } from './conversion/transformers/task-list.js';

/**
 * @import { EditorThemeClasses, LexicalCommand } from 'lexical';
 * @import { ListType } from '@lexical/list';
 * @import { Transformer } from '@lexical/markdown';
 * @import {
 * TextEditorBlockType,
 * TextEditorFormatType,
 * TextEditorInlineType,
 * TextEditorNodeType,
 * } from '#lib/typedefs.js';
 */

/**
 * @type {EditorThemeClasses}
 */
export const EDITOR_THEME = {
  text: {
    /**
     * Enable bold+italic, underline and strikethrough styling. Lexical only uses the combined
     * class for text that is both underlined and struck through.
     * @see https://github.com/facebook/lexical/discussions/4381
     */
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikethrough',
    underlineStrikethrough: 'underline strikethrough',
  },
  list: {
    nested: {
      listitem: 'nested',
    },
    // Task list items, drawn with a check box; see `lexical-root.svelte`
    listitemChecked: 'task-list-item checked',
    listitemUnchecked: 'task-list-item',
  },
  code: 'code-block',
  // Lexical wraps a table with an element to scroll it horizontally when the table button is
  // enabled; see `initEditor()`
  tableScrollableWrapper: 'table-wrapper',
  tableCellSelected: 'selected',
  tableSelection: 'table-selection',
};

/**
 * List of available buttons.
 * @type {{ [key: string]: { labelKey: string, icon: string, inline: boolean } }}
 */
export const AVAILABLE_BUTTONS = {
  bold: {
    labelKey: 'bold',
    icon: 'format_bold',
    inline: true,
  },
  italic: {
    labelKey: 'italic',
    icon: 'format_italic',
    inline: true,
  },
  underline: {
    labelKey: 'underline',
    icon: 'format_underlined',
    inline: true,
  },
  strikethrough: {
    labelKey: 'strikethrough',
    icon: 'strikethrough_s',
    inline: true,
  },
  code: {
    labelKey: 'code',
    icon: 'code',
    inline: true,
  },
  link: {
    labelKey: 'link',
    icon: 'link',
    inline: true,
  },
  paragraph: {
    labelKey: 'paragraph',
    icon: 'format_paragraph',
    inline: false,
  },
  'heading-1': {
    labelKey: 'heading_1',
    icon: 'format_h1',
    inline: false,
  },
  'heading-2': {
    labelKey: 'heading_2',
    icon: 'format_h2',
    inline: false,
  },
  'heading-3': {
    labelKey: 'heading_3',
    icon: 'format_h3',
    inline: false,
  },
  'heading-4': {
    labelKey: 'heading_4',
    icon: 'format_h4',
    inline: false,
  },
  'heading-5': {
    labelKey: 'heading_5',
    icon: 'format_h5',
    inline: false,
  },
  'heading-6': {
    labelKey: 'heading_6',
    icon: 'format_h6',
    inline: false,
  },
  'bulleted-list': {
    labelKey: 'bulleted_list',
    icon: 'format_list_bulleted',
    inline: false,
  },
  'numbered-list': {
    labelKey: 'numbered_list',
    icon: 'format_list_numbered',
    inline: false,
  },
  'task-list': {
    labelKey: 'task_list',
    icon: 'checklist',
    inline: false,
  },
  blockquote: {
    labelKey: 'blockquote',
    icon: 'format_quote',
    inline: false,
  },
  'code-block': {
    labelKey: 'code_block',
    icon: 'code_blocks',
    inline: false,
  },
  table: {
    labelKey: 'insert_table',
    icon: 'table',
    inline: false,
  },
  'horizontal-rule': {
    labelKey: 'insert_horizontal_rule',
    icon: 'horizontal_rule',
    inline: false,
  },
};

/**
 * @type {TextEditorFormatType[]}
 */
export const TEXT_FORMAT_BUTTON_TYPES = ['bold', 'italic', 'underline', 'strikethrough', 'code'];

/**
 * @type {TextEditorInlineType[]}
 */
export const INLINE_BUTTON_TYPES = [...TEXT_FORMAT_BUTTON_TYPES, 'link'];

/**
 * @type {TextEditorBlockType[]}
 */
export const BLOCK_BUTTON_TYPES = [
  'paragraph',
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
  'heading-5',
  'heading-6',
  'bulleted-list',
  'numbered-list',
  'task-list',
  'blockquote',
  'code-block',
];

/**
 * Buttons only available for HTML, as Markdown has no syntax for them: the underline format and the
 * alignment menu. They’re hidden for Markdown and in the plain text mode, which shows the HTML
 * source, and they’re not enabled by default.
 * @type {('underline' | 'align')[]}
 */
export const HTML_ONLY_BUTTON_TYPES = ['underline', 'align'];

/**
 * Check whether the given button is only available for HTML. See {@link HTML_ONLY_BUTTON_TYPES}.
 * @param {string} type Button type.
 * @returns {type is 'underline' | 'align'} Result.
 */
export const isHtmlOnlyButton = (type) =>
  /** @type {string[]} */ (HTML_ONLY_BUTTON_TYPES).includes(type);

/**
 * Text formats only available for HTML, like underline. See {@link HTML_ONLY_BUTTON_TYPES}.
 */
export const HTML_ONLY_FORMAT_TYPES = TEXT_FORMAT_BUTTON_TYPES.filter(isHtmlOnlyButton);

/**
 * Buttons not enabled by default: the HTML-only ones and the task list, a GitHub Flavored Markdown
 * extension that not every Markdown renderer supports.
 * @type {TextEditorNodeType[]}
 */
export const OPTIONAL_BUTTON_TYPES = [...HTML_ONLY_BUTTON_TYPES, 'task-list'];

/**
 * Buttons enabled by default: all the inline and block level buttons but the optional ones.
 * @type {TextEditorNodeType[]}
 */
export const DEFAULT_BUTTON_TYPES = [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES].filter(
  (type) => !OPTIONAL_BUTTON_TYPES.includes(type),
);

/**
 * List block types, with their Lexical list type and the command to insert the list.
 * @type {{ type: TextEditorBlockType, listType: ListType, command: LexicalCommand<void> }[]}
 */
export const LIST_TYPES = [
  { type: 'bulleted-list', listType: 'bullet', command: INSERT_UNORDERED_LIST_COMMAND },
  { type: 'numbered-list', listType: 'number', command: INSERT_ORDERED_LIST_COMMAND },
  { type: 'task-list', listType: 'check', command: INSERT_CHECK_LIST_COMMAND },
];

/**
 * Map of Lexical nodes for each block type. The `paragraph` block type is excluded because it is
 * the default block type.
 * @type {Record<Exclude<TextEditorBlockType | 'link', 'paragraph'>, any[]>}
 */
export const NODE_MAP = {
  'heading-1': [HeadingNode],
  'heading-2': [HeadingNode],
  'heading-3': [HeadingNode],
  'heading-4': [HeadingNode],
  'heading-5': [HeadingNode],
  'heading-6': [HeadingNode],
  'bulleted-list': [ListNode, ListItemNode],
  'numbered-list': [ListNode, ListItemNode],
  'task-list': [ListNode, ListItemNode],
  blockquote: [QuoteNode],
  'code-block': [CodeNode, CodeHighlightNode],
  link: [LinkNode],
};

/**
 * Map of Lexical transformers for each button type. The `paragraph` block type has none because it
 * is the default block type, and neither have the HTML-only buttons. Horizontal rules and tables
 * are always supported in Markdown, so their transformers are added in `core.js`.
 * @type {Partial<Record<TextEditorNodeType, Transformer[]>>}
 */
export const TRANSFORMER_MAP = {
  // ELEMENT_TRANSFORMERS
  'heading-1': [HEADING],
  'heading-2': [HEADING],
  'heading-3': [HEADING],
  'heading-4': [HEADING],
  'heading-5': [HEADING],
  'heading-6': [HEADING],
  // Before the bulleted list, as `- [ ] item` matches both
  'task-list': [TASK_LIST],
  'bulleted-list': [UNORDERED_LIST],
  'numbered-list': [ORDERED_LIST],
  blockquote: [QUOTE],
  // MULTILINE_ELEMENT_TRANSFORMERS
  'code-block': [CODE],
  // TEXT_FORMAT_TRANSFORMERS
  // The second one keeps the backslashes in inline code at the start of a node
  code: [INLINE_CODE, LEADING_INLINE_CODE],
  bold: [
    BOLD_STAR,
    // Disabled for Markdown output in `DISABLED_MARKDOWN_TAGS` below
    BOLD_UNDERSCORE,
    BOLD_ITALIC_STAR,
    BOLD_ITALIC_UNDERSCORE,
  ],
  italic: [
    ITALIC_UNDERSCORE,
    // Disabled for Markdown output in `DISABLED_MARKDOWN_TAGS` below
    ITALIC_STAR,
    BOLD_ITALIC_STAR,
    BOLD_ITALIC_UNDERSCORE,
  ],
  strikethrough: [STRIKETHROUGH],
  // TEXT_MATCH_TRANSFORMERS
  // Unlike Lexical’s, it keeps the formats of the whole link text outside the link
  link: [LINK],
};

/**
 * List of Markdown tags that should be disabled in the editor when converting Lexical nodes to
 * Markdown (but not when converting Markdown to Lexical nodes because we don’t want to lose any
 * formatting). Use underscore for italic text in Markdown instead of asterisks, and use double
 * asterisks for bold text in Markdown instead of underscores. Also, disable triple asterisks and
 * triple underscores for bold+italic text in Markdown, which can be confusing and is not commonly
 * used. This is to ensure that the Markdown output is more readable and consistent.
 */
export const DISABLED_MARKDOWN_TAGS = ['*', '__', '***', '___'];

/**
 * Tag of the Lexical update that imports a value set from outside, so the editor can tell it from a
 * change made by the user. A custom node can check it with `$hasUpdateTag()` in its `createDOM()`
 * method to tell whether it’s being rendered for an imported value.
 */
export const IMPORT_UPDATE_TAG = 'sui-import';

/**
 * Command to show the floating link editor for the link at the selection, or for the selected text
 * to be linked. A listener returns `false` when there is no link or text to edit, in which case the
 * Link button falls back to the dialog.
 * @type {LexicalCommand<void>}
 */
export const OPEN_LINK_EDITOR_COMMAND = createCommand('OPEN_LINK_EDITOR_COMMAND');

/**
 * Text alignments offered by the alignment menu, which is only available for HTML, as Markdown
 * has no syntax for alignment. Like most editors, it offers the physical sides rather than the
 * logical `start` and `end`, which are still kept as is when the HTML has them.
 * @type {{ type: 'left' | 'center' | 'right' | 'justify', labelKey: string, icon: string }[]}
 */
export const ALIGNMENT_OPTIONS = [
  { type: 'left', labelKey: 'align_left', icon: 'format_align_left' },
  { type: 'center', labelKey: 'align_center', icon: 'format_align_center' },
  { type: 'right', labelKey: 'align_right', icon: 'format_align_right' },
  { type: 'justify', labelKey: 'align_justify', icon: 'format_align_justify' },
];

/**
 * Default number of rows, including the header row, and columns of a new table.
 */
export const DEFAULT_TABLE_SIZE = 3;

/**
 * Maximum number of rows and columns of a new table.
 */
export const MAX_TABLE_SIZE = 50;
