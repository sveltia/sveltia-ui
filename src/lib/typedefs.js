/**
 * @import { Snippet } from 'svelte';
 * @import { Transformer } from '@lexical/markdown';
 * @import { LexicalEditor, LexicalNode } from 'lexical';
 */

/**
 * @typedef {object} ButtonProps
 * @property {HTMLButtonElement} [element] Reference to the `<button>` element.
 * @property {string} [class] The `class` attribute on the `<button>` element.
 * @property {'button' | 'submit' | 'reset'} [type] The `type` attribute on the `<button>` element.
 * @property {string} [role] The `role` attribute on the `<button>` element.
 * @property {string} [name] The `data-name` attribute on the `<button>` element.
 * @property {any} [value] The `data-value` attribute on the `<button>` element.
 * @property {string} [valueType] Data type of the `value`. Typically `string`, `number` or
 * `boolean`. Default: auto detect.
 * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden` attribute.
 * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
 * attribute.
 * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
 * `aria-readonly` attribute used in certain roles, including `checkbox`, `listbox`, `slider` and
 * `textbox`.
 * @property {boolean | 'mixed'} [pressed] Whether to mark the widget pressed. An alias of the
 * `aria-pressed` attribute.
 * @property {string} [keyShortcuts] Keyboard shortcuts. An alias of the `aria-keyshortcuts`
 * attribute. Accepts the special `Accel` key, which will be replaced with `Control` or `Meta`
 * depending on the user’s operating system.
 * @property {string} [label] Text label displayed on the button.
 * @property {number} [lines] Number of lines to show the label. Overflowing text will be truncated.
 * @property {'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link'} [variant] The style variant
 * of the button.
 * @property {'small' | 'medium' | 'large'} [size] The size of the button.
 * @property {boolean} [iconic] Whether to only show an icon on the button and trim the padding.
 * @property {boolean} [pill] Whether to make the button rounded.
 * @property {boolean} [flex] Make the button width flexible.
 * @property {PopupPosition} [popupPosition] Where to show the dropdown menu.
 * @property {boolean} [showPopupBackdrop] Whether to show the backdrop for the popup.
 * @property {Snippet} [children] Primary slot content.
 * @property {Snippet} [startIcon] Start icon slot content.
 * @property {Snippet} [endIcon] End icon slot content.
 * @property {Snippet} [popup] Popup slot content.
 * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
 * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
 * @property {(event: CustomEvent) => void} [onToggle] Custom `Toggle` event handler.
 */

/**
 * @typedef {object} ModalProps
 * @property {string} [class] The `class` attribute on the content element.
 * @property {'dialog' | 'alertdialog' | 'none'} [role] The `role` attribute on the `<dialog>`
 * element.
 * @property {boolean} [open] Whether to show the modal.
 * @property {boolean} [showBackdrop] Whether to show the backdrop.
 * @property {boolean} [lightDismiss] Whether to close the modal when the backdrop (outside of the
 * modal) is clicked.
 * @property {boolean} [escapeDismiss] Whether to close the modal when the Escape key is pressed.
 * @property {boolean} [keepContent] Whether to keep the content in the DOM tree when the modal is
 * not displayed.
 * @property {HTMLDialogElement} [dialog] A reference to the `<dialog>` element.
 * @property {Snippet} [children] Primary slot content.
 * @property {Snippet} [extraContent] Extra slot content.
 * @property {(event: CustomEvent) => void} [onOpening] Custom `Opening` event handler.
 * @property {(event: CustomEvent) => void} [onOpen] Custom `Open` event handler.
 * @property {(event: CustomEvent) => void} [onOk] Custom `Ok` event handler.
 * @property {(event: CustomEvent) => void} [onCancel] Custom `Cancel` event handler.
 * @property {(event: CustomEvent) => void} [onClosing] Custom `Closing` event handler.
 * @property {(event: CustomEvent) => void} [onClose] Custom `Close` event handler.
 */

/**
 * @typedef {object} DialogProps
 * @property {string} [title] Text label displayed on the header. Required.
 * @property {'dialog' | 'alertdialog'} [role] The `role` attribute on the `<dialog>` element.
 * @property {'small' | 'medium' | 'large' | 'x-large'} [size] Width of the dialog.
 * @property {string} [class] The `class` attribute on the `<dialog>` element.
 * @property {boolean} [open] Whether to open the dialog.
 * @property {boolean} [showClose] Whether to show the Close button on the header.
 * @property {boolean} [showOk] Whether to show the OK button on the footer.
 * @property {boolean} [showCancel] Whether to show the Cancel button on the footer.
 * @property {string} [okLabel] Text label displayed on the OK button.
 * @property {string} [okShortcuts] Keyboard shortcuts for the OK button. An alias of the
 * `aria-keyshortcuts` attribute. Accepts the special `Accel` key, which will be replaced with
 * `Control` or `Meta` depending on the user’s operating system.
 * @property {boolean} [okDisabled] Whether to disable the OK button.
 * @property {string} [cancelLabel] Text label displayed on the Cancel button.
 * @property {string} [cancelShortcuts] Keyboard shortcuts for the Cancel button. An alias of the
 * `aria-keyshortcuts` attribute. Accepts the special `Accel` key, which will be replaced with
 * `Control` or `Meta` depending on the user’s operating system.
 * @property {boolean} [cancelDisabled] Whether to disable the Cancel button.
 * @property {boolean} [focusInput] Whether to automatically focus the first input field or primary
 * action button. Default: `true`. If `false`, the `<dialog>` gets focused.
 * @property {boolean} [lightDismiss] Whether to close the modal when the backdrop (outside of the
 * modal) is clicked.
 * @property {string} [value] Value entered on the textbox.
 * @property {Snippet} [children] Primary slot content.
 * @property {Snippet} [header] Header slot content.
 * @property {Snippet} [headerExtra] Header extra slot content.
 * @property {Snippet} [footer] Footer slot content.
 * @property {Snippet} [footerExtra] Footer extra slot content.
 * @property {Snippet} [closeIcon] Close icon slot content.
 * @property {Snippet} [extraContent] Extra content slot content.
 */

/**
 * @typedef {object} MenuItemProps
 * @property {string} [class] The `class` attribute on the wrapper element.
 * @property {'menuitem' | 'menuitemcheckbox' | 'menuitemradio'} [role] The `role` attribute on the
 * `<button>` element.
 * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
 * attribute.
 * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
 * attribute.
 * @property {boolean} [checked] Whether to check the widget. An alias of the `aria-checked`
 * attribute.
 * @property {string} [label] Text label displayed on the item.
 * @property {Snippet} [children] Primary slot content.
 * @property {Snippet} [startIcon] Start icon slot content.
 * @property {Snippet} [endIcon] End icon slot content.
 * @property {Snippet} [chevronIcon] Chevron icon slot content.
 * @property {Snippet} [items] Items slot content.
 * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
 * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
 */

/**
 * @typedef {object} ComboboxProps
 * @property {string} [class] The `class` attribute on the wrapper element.
 * @property {boolean} [hidden] Whether to hide the widget.
 * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
 * attribute.
 * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
 * `aria-readonly` attribute.
 * @property {boolean} [required] Whether to mark the widget required. An alias of the
 * `aria-required` attribute.
 * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the `aria-invalid`
 * attribute.
 * @property {any} [value] Selected option’s value.
 * @property {boolean} [editable] Whether to make the `combobox` editable.
 * @property {PopupPosition} [position] Where to show the dropdown menu.
 * @property {number} [filterThreshold] Number of items to start showing the filter. Default: `5`.
 * Use `-1` to always hide the filter.
 * @property {Snippet} [children] Primary slot content.
 * @property {Snippet} [chevronIcon] Chevron icon slot content.
 * @property {(event: CustomEvent) => void} [onChange] Custom `change` event handler.
 */

/**
 * @typedef {object} TextInputProps
 * @property {HTMLInputElement} [element] Reference to the `<input>` element.
 * @property {'textbox' | 'searchbox' | 'combobox' | 'spinbutton' | 'gridcell'} [role] The `role`
 * attribute on the `<input>` element.
 * @property {string} [keyShortcuts] Keyboard shortcuts. An alias of the `aria-keyshortcuts`
 * attribute. Accepts the special `Accel` key, which will be replaced with `Control` or `Meta`
 * depending on the user’s operating system.
 * @property {string} [name] The `name` attribute on the `<input>` element.
 * @property {boolean} [showInlineLabel] Whether to display `aria-label` over the `<input>` element
 * if it’s empty, just like how the HTML `placeholder` attribute works.
 * @property {'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'} [inputmode] The
 * `inputmode` attribute on the `<input>`.
 * @property {boolean} [flex] Make the text input container flexible.
 * @property {string} [class] The `class` attribute on the wrapper element.
 * @property {boolean} [hidden] Whether to hide the widget.
 * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
 * attribute.
 * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
 * `aria-readonly` attribute.
 * @property {boolean} [required] Whether to mark the widget required. An alias of the
 * `aria-required` attribute.
 * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the `aria-invalid`
 * attribute.
 * @property {string} [aria-label] `aria-label` attribute.
 * @property {Snippet} [children] Primary slot content.
 */

/**
 * @typedef {object} KeyboardEventHandlers
 * @property {(event: KeyboardEvent) => void} [onkeydown] `keydown` event handler.
 * @property {(event: KeyboardEvent) => void} [onkeyup] `keyup` event handler.
 * @property {(event: KeyboardEvent) => void} [onkeypress] `keypress` event handler.
 */

/**
 * @typedef {object} MouseEventHandlers
 * @property {(event: MouseEvent) => void} [onmouseenter] `mouseenter` event handler.
 * @property {(event: MouseEvent) => void} [onmouseleave] `mouseleave` event handler.
 * @property {(event: MouseEvent) => void} [onmouseover] `mouseover` event handler.
 * @property {(event: MouseEvent) => void} [onmousedown] `mousedown` event handler.
 * @property {(event: MouseEvent) => void} [onmouseup] `mouseup` event handler.
 * @property {(event: MouseEvent) => void} [onclick] `click` event handler.
 * @property {(event: MouseEvent) => void} [ondblclick] `dblclick` event handler.
 */

/**
 * @typedef {object} FocusEventHandlers
 * @property {(event: FocusEvent) => void} [onfocus] `focus` event handler.
 * @property {(event: FocusEvent) => void} [onblur] `blur` event handler.
 */

/**
 * @typedef {object} DragEventHandlers
 * @property {(event: DragEvent) => void} [ondragstart] `dragstart` event handler.
 * @property {(event: DragEvent) => void} [ondrag] `drag` event handler.
 * @property {(event: DragEvent) => void} [ondragenter] `dragenter` event handler.
 * @property {(event: DragEvent) => void} [ondragleave] `dragleave` event handler.
 * @property {(event: DragEvent) => void} [ondragover] `dragover` event handler.
 * @property {(event: DragEvent) => void} [ondrop] `drop` event handler.
 * @property {(event: DragEvent) => void} [ondragend] `dragend` event handler.
 */

/**
 * @typedef {KeyboardEventHandlers & MouseEventHandlers & FocusEventHandlers & DragEventHandlers}
 * CommonEventHandlers
 */

/**
 * @typedef {object} InputEventHandlers
 * @property {(event: Event) => void} [oninput] `input` event handler.
 * @property {(event: Event) => void} [onbeforeinput] `beforeinput` event handler.
 * @property {(event: Event) => void} [onchange] `change` event handler.
 */

/**
 * @typedef {('top-left' | 'top-right' | 'right-top' | 'right-bottom' | 'bottom-left' |
 * 'bottom-right'|'left-top'|'left-bottom')} PopupPosition
 */

/**
 * @typedef {'auto' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' |
 * 'bottom-right'} ToastPosition
 */

/**
 * @typedef {'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4' | 'heading-5' |
 * 'heading-6' | 'bulleted-list' | 'numbered-list' | 'blockquote' | 'code-block'}
 * TextEditorBlockType
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
 * @typedef {object} TextEditorComponent
 * @property {string} id Component ID.
 * @property {string} label Component label.
 * @property {string} [icon] Material Symbols icon name.
 * @property {LexicalNode} node Lexical node class implementation.
 * @property {(props?: Record<string, any>) => LexicalNode} createNode Function to create a new node
 * instance.
 * @property {Transformer} transformer Node transformer.
 */

/**
 * @typedef {object} TextEditorConfig
 * @property {TextEditorMode[]} modes Enabled modes.
 * @property {(TextEditorBlockType | TextEditorInlineType)[]} enabledButtons Enabled buttons for the
 * editor.
 * @property {TextEditorComponent[]} components Editor components.
 * @property {boolean} isCodeEditor Whether the editor is used as a code editor.
 * @property {string} [defaultLanguage] Default language for the code editor.
 */

/**
 * @typedef {object} TextEditorSelectionState
 * @property {?string} blockNodeKey Block level node key.
 * @property {TextEditorBlockType} blockType Block level type of the current selection.
 * @property {TextEditorInlineType[]} inlineTypes Inline level types of the current selection.
 */

/**
 * @typedef {object} TextEditorStore
 * @property {LexicalEditor | undefined} editor Lexical editor instance.
 * @property {boolean} initialized Whether the Lexical editor is initialized.
 * @property {string} editorId Random ID assigned to the editor.
 * @property {TextEditorConfig} config Editor configuration.
 * @property {string} inputValue Value entered the Lexical editor.
 * @property {TextEditorSelectionState} selection Current selection state.
 * @property {boolean} useRichText Whether to use rich text mode. If `false`, the editor shows the
 * plain text editor.
 * @property {boolean} hasConverterError Whether there was an error while converting Markdown to
 * Lexical nodes.
 * @property {boolean} showConverterError Whether to show a converter error in the UI.
 * @property {() => Promise<void>} convertMarkdown Function to trigger the Lexical converter.
 */

/**
 * @typedef {object} SelectedItemDetail
 * @property {HTMLElement} target Element to get the detail from.
 * @property {string} type Data type of the `value`. Typically `string`, `number` or `boolean`.
 * @property {string | undefined} name The `data-name` attribute on the element.
 * @property {string | undefined} label The `data-label` attribute on the element.
 * @property {any} value The `data-value` attribute on the element. Casted to the `valueType`.
 */

export {};
