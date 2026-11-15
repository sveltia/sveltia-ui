/**
 * HTML of GitHub Flavored Markdown task lists, which Lexical calls check lists. They’re exported
 * the way GitHub and markdown-it render them, a `<ul class="contains-task-list">` holding
 * `<li class="task-list-item">` items that start with a disabled `<input type="checkbox">`, which
 * Lexical imports back as a check list. The Markdown transformer is in
 * `../transformers/task-list.js`.
 */

import { $isListNode as isListNode } from '@lexical/list';

/**
 * @import { ListItemNode, ListNode } from '@lexical/list';
 * @import { DOMConversion, DOMConversionMap, DOMConversionOutput } from 'lexical';
 */

/**
 * Add the class of a task list to the exported element of a check list.
 * @param {ListNode} node List node.
 * @param {HTMLElement} element Exported element.
 */
export const decorateTaskList = (node, element) => {
  if (node.getListType() === 'check') {
    element.classList.add('contains-task-list');
  }
};

/**
 * Add the class and a disabled check box to the exported element of a check list item. An item
 * that only holds a nested list has neither, as it’s merged into the previous item.
 * @param {ListItemNode} node List item node.
 * @param {HTMLElement} element Exported element.
 */
export const decorateTaskListItem = (node, element) => {
  const parent = node.getParent();

  if (!isListNode(parent) || parent.getListType() !== 'check' || isListNode(node.getFirstChild())) {
    return;
  }

  const checkbox = element.ownerDocument.createElement('input');

  checkbox.type = 'checkbox';
  checkbox.disabled = true;
  checkbox.toggleAttribute('checked', !!node.getChecked());
  element.classList.add('task-list-item');
  element.prepend(checkbox, ' ');
};

/**
 * Check whether the given element is the check box of a task list item, like the `<input>` in
 * `<li class="task-list-item"><input type="checkbox" disabled> Item</li>`. Lexical imports the
 * item as a check list item, taking its state from the first `<input>` in it.
 * @param {Element} element Element.
 * @returns {boolean} Result.
 */
export const isTaskListCheckbox = (element) =>
  element.localName === 'input' &&
  element.getAttribute('type')?.toLowerCase() === 'checkbox' &&
  !!element.parentElement?.matches('li.task-list-item') &&
  element.parentElement.querySelector(':scope > input') === element;

/**
 * Drop an element without importing it.
 * @returns {DOMConversionOutput} Conversion output.
 */
const dropElement = () => ({ node: null });

/**
 * Additional DOM conversions to import HTML with task lists. The check box of a task list item is
 * dropped, as Lexical has already taken its state for the item. Any other `<input>` is still
 * reported by `findUnsupportedNode()` in `unsupported.js`.
 * @type {DOMConversionMap}
 */
export const HTML_TASK_LIST_IMPORT_MAP = {
  /**
   * Get the conversion for an `<input>` element.
   * @param {HTMLElement} element Element.
   * @returns {DOMConversion | null} Conversion.
   */
  input: (element) =>
    isTaskListCheckbox(element) ? { conversion: dropElement, priority: 1 } : null,
};
