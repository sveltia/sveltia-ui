/**
 * Placing the caret and the focus in the editor.
 */

import {
  $createParagraphNode as createParagraphNode,
  $getNearestNodeFromDOMNode as getNearestNodeFromDOMNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $isDecoratorNode as isDecoratorNode,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
} from 'lexical';

/**
 * @import { LexicalEditor } from 'lexical';
 */

/**
 * Selector for the elements in a decorator node, like an editor component, that handle a click on
 * their own.
 */
const DECORATOR_INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  // A label moves the focus to its control on click
  'label',
  'summary',
  'video[controls]',
  'audio[controls]',
  '[tabindex]',
  '[draggable="true"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/**
 * Whether a click on the given element would put the caret on the static content of a decorator
 * node, like the label or padding of an editor component. The editor cannot map such a position to
 * a node, so the caret appears there but typing does nothing.
 * @param {EventTarget | null} target Event target.
 * @returns {boolean} Result.
 */
export const isStaticDecoratorContent = (target) => {
  if (!(target instanceof Element)) {
    return false;
  }

  const decorator = target.closest('[data-lexical-decorator]');

  if (!decorator) {
    return false;
  }

  const interactive = target.closest(DECORATOR_INTERACTIVE_SELECTOR);

  // An interactive element outside the decorator is the editor root or one of its ancestors
  return !interactive || !decorator.contains(interactive);
};

/**
 * Move a caret placed directly on the root node into a block: the adjacent paragraph or other
 * block, or a new paragraph if the adjacent nodes are decorators, where nothing can be typed.
 * @returns {boolean} Whether the selection has been moved.
 */
const $moveCaretIntoBlock = () => {
  const selection = getSelection();

  if (
    !isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    selection.anchor.type !== 'element'
  ) {
    return false;
  }

  const root = getRoot();

  if (!selection.anchor.getNode().is(root)) {
    return false;
  }

  const { offset } = selection.anchor;
  const before = root.getChildAtIndex(offset - 1);
  const after = root.getChildAtIndex(offset);

  if (isElementNode(after)) {
    after.selectStart();
  } else if (isElementNode(before)) {
    before.selectEnd();
  } else {
    const paragraph = createParagraphNode();

    if (before) {
      before.insertAfter(paragraph);
    } else if (after) {
      after.insertBefore(paragraph);
    } else {
      root.append(paragraph);
    }

    paragraph.select();
  }

  return true;
};

/**
 * Move the focus to the editor, and run the given function with the node of the given element
 * within an editor update.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} element Element of the node.
 * @param {(node: ReturnType<typeof getNearestNodeFromDOMNode>) => void} callback Function to be
 * called with the node.
 */
const updateNodeWithFocus = (editor, element, callback) => {
  editor.getRootElement()?.focus({ preventScroll: true });

  editor.update(() => {
    callback(getNearestNodeFromDOMNode(element));
  });
};

/**
 * Move the focus to the editor, and the caret to right after the given decorator node, like an
 * editor component: the start of the next block, or a new paragraph if there’s none to type in.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} decorator Element of the decorator node.
 */
const placeCaretAfterDecorator = (editor, decorator) => {
  updateNodeWithFocus(editor, decorator, (node) => {
    // The element has been found by its `data-lexical-decorator` attribute
    /* v8 ignore next 3 */
    if (!isDecoratorNode(node)) {
      return;
    }

    node.selectNext();
    $moveCaretIntoBlock();
  });
};

/**
 * Move the focus to the editor, and the caret to the end of the given block.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} block Element of the block node.
 */
const placeCaretAtBlockEnd = (editor, block) => {
  updateNodeWithFocus(editor, block, (node) => {
    /* v8 ignore next 3 */
    if (!isElementNode(node)) {
      return;
    }

    node.selectEnd();
  });
};

/**
 * Handle a `mousedown` event on the editor, placing the caret where the user expects, rather than
 * leaving it to the browser, when the pointer is not on any editable text. Browsers disagree on
 * where the caret goes in these cases, and some put it within a decorator node, like an editor
 * component, where the editor cannot map it to a node, so typing does nothing:
 *
 * - The static content of a decorator, like its label or padding, places the caret after it.
 * - The empty area of the editor, outside any block, places the caret after the decorator above
 * the pointer, or at the end of the block above the pointer.
 * @param {LexicalEditor} editor Editor instance.
 * @param {MouseEvent} event `mousedown` event.
 * @returns {boolean} Whether the event has been handled.
 */
export const handleEditorMouseDown = (editor, event) => {
  const { target, button, shiftKey, clientY } = event;
  const root = editor.getRootElement();

  // Leave the primary button with Shift, which extends the selection, and other buttons alone.
  // Leave a read-only editor alone as well, as a paragraph may be added, and an event already
  // handled by a nested editor, like one in an editor component
  if (
    !root ||
    !editor.isEditable() ||
    event.defaultPrevented ||
    button !== 0 ||
    shiftKey ||
    !(target instanceof Element)
  ) {
    return false;
  }

  if (isStaticDecoratorContent(target)) {
    const decorator = /** @type {Element} */ (target.closest('[data-lexical-decorator]'));

    // A decorator of a nested editor, like one in an editor component, is handled by that editor
    if (decorator.parentElement?.closest('[data-lexical-editor]') !== root) {
      return false;
    }

    event.preventDefault();
    placeCaretAfterDecorator(editor, decorator);

    return true;
  }

  if (target !== root) {
    return false;
  }

  // Find the last block starting above the pointer. Lexical adds a hidden element to the root
  // after a decorator, which has no size
  const block = [...root.children]
    .filter((element) => !element.hasAttribute('data-lexical-decorator-boundary'))
    .findLast((element) => element.getBoundingClientRect().top <= clientY);

  if (!block) {
    return false;
  }

  if (block.hasAttribute('data-lexical-decorator')) {
    event.preventDefault();
    placeCaretAfterDecorator(editor, block);

    return true;
  }

  // Beside a block, the browser can find the nearest text on its own
  if (clientY <= block.getBoundingClientRect().bottom) {
    return false;
  }

  event.preventDefault();
  placeCaretAtBlockEnd(editor, block);

  return true;
};

/**
 * Move focus to the editor so the user can start editing immediately.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {Promise<void>} Nothing.
 */
export const focusEditor = async (editor) =>
  new Promise((resolve) => {
    editor.focus(() => {
      resolve(undefined);
    });
  });
