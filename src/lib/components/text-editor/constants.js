import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CODE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

/**
 * @import { EditorThemeClasses } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 * @import {
 * TextEditorBlockType,
 * TextEditorFormatType,
 * TextEditorInlineType,
 * TextEditorNodeType,
 * } from '$lib/typedefs';
 */

export const PRISM_BASE_URL = `https://unpkg.com/prismjs@1.30.0`;

/**
 * @type {EditorThemeClasses}
 */
export const EDITOR_THEME = {
  text: {
    /**
     * Enable bold+italic and strikethrough styling.
     * @see https://github.com/facebook/lexical/discussions/4381
     */
    italic: 'italic',
    strikethrough: 'strikethrough',
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
};

/**
 * @type {TextEditorFormatType[]}
 */
export const TEXT_FORMAT_BUTTON_TYPES = ['bold', 'italic', 'strikethrough', 'code'];

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
  'blockquote',
  'code-block',
];

/**
 * Image related components IDs. `linked-image` is used in Sveltia CMS.
 */
export const IMAGE_COMPONENT_IDS = ['image', 'linked-image'];

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
  blockquote: [QuoteNode],
  'code-block': [CodeNode, CodeHighlightNode],
  link: [LinkNode],
};

/**
 * Map of Lexical transformers for each block type. The `paragraph` block type is excluded because
 * it is the default block type.
 * @type {Record<Exclude<TextEditorNodeType, 'paragraph'>, Transformer[]>}
 */
export const TRANSFORMER_MAP = {
  // ELEMENT_TRANSFORMERS
  'heading-1': [HEADING],
  'heading-2': [HEADING],
  'heading-3': [HEADING],
  'heading-4': [HEADING],
  'heading-5': [HEADING],
  'heading-6': [HEADING],
  'bulleted-list': [UNORDERED_LIST],
  'numbered-list': [ORDERED_LIST],
  blockquote: [QUOTE],
  // MULTILINE_ELEMENT_TRANSFORMERS
  'code-block': [CODE],
  // TEXT_FORMAT_TRANSFORMERS
  code: [INLINE_CODE],
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
