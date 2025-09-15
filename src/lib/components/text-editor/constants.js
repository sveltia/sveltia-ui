/**
 * @import { TextEditorBlockType, TextEditorFormatType, TextEditorInlineType } from '$lib/typedefs';
 */

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
export const TEXT_FORMAT_BUTTON_TYPES = ['bold', 'italic', 'code'];

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
