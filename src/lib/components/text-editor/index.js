/**
 * List of available buttons.
 * @type {{ [key: string]: { labelKey: string, icon: string, inline: boolean } }}
 */
export const availableButtons = {
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
};
/**
 * @type {import('$lib/typedefs').TextEditorFormatType[]}
 */
export const textFormatButtonTypes = ['bold', 'italic', 'code'];
/**
 * @type {import('$lib/typedefs').TextEditorInlineType[]}
 */
export const inlineButtonTypes = [...textFormatButtonTypes, 'link'];
/**
 * @type {import('$lib/typedefs').TextEditorBlockType[]}
 */
export const blockButtonTypes = [
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
];
