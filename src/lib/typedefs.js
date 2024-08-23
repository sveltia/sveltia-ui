/**
 * @typedef {('top-left' | 'top-right' | 'right-top' | 'right-bottom' | 'bottom-left' |
 * 'bottom-right'|'left-top'|'left-bottom')} PopupPosition
 */

/**
 * @typedef {'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' |
 * 'bottom-right'} ToastPosition
 */

/**
 * @typedef {'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4' | 'heading-5' |
 * 'heading-6' | 'bulleted-list' | 'numbered-list' | 'blockquote'} TextEditorBlockType
 */

/**
 * @typedef {'bold' | 'italic' | 'code'} TextEditorFormatType
 */

/**
 * @typedef {TextEditorFormatType | 'link'} TextEditorInlineType
 */

/**
 * @typedef {'rich-text' | 'plain-text'} TextEditorMode
 */

/**
 * @typedef {object} TextEditorState
 * @property {import('svelte/store').Writable<import('lexical').LexicalEditor>} editor - Lexical
 * editor instance.
 * @property {import('svelte/store').Writable<string>} editorId - Random ID assigned to the editor.
 * @property {import('svelte/store').Writable<TextEditorBlockType>} selectionBlockType - Block level
 * type of the current selection.
 * @property {import('svelte/store').Writable<TextEditorInlineType[]>} selectionInlineTypes - Inline
 * level types of the current selection.
 * @property {TextEditorMode[]} modes - Enabled modes.
 * @property {import('svelte/store').Writable<boolean>} useRichText - Whether to use rich text mode.
 * If `false`, the editor shows the plain text editor.
 * @property {import('svelte/store').Writable<boolean>} hasConverterError - `true` if there was an
 * error while converting Markdown to Lexical nodes.
 * @property {(TextEditorBlockType | TextEditorInlineType)[]} enabledButtons - Enabled buttons for
 * the editor.
 * @property {Function} convertMarkdown - Function to trigger the Lexical converter.
 */

export {};
