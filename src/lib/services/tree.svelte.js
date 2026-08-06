import { isRTL } from '@sveltia/i18n';
import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';
import { normalize } from './group.svelte.js';
import { getSelectedItemDetail } from './select.svelte.js';

/**
 * @import { Attachment } from 'svelte/attachments';
 */

/**
 * How long to wait, in milliseconds, before the type-ahead search terms are reset.
 */
const TYPE_AHEAD_TIMEOUT = 500;
/**
 * CSS selector to retrieve the tree items.
 */
const ITEM_SELECTOR = '[role="treeitem"]';
/**
 * CSS selector to retrieve the tree item containers, including the widget root.
 */
const GROUP_SELECTOR = '[role="group"], [role="tree"]';

/**
 * Implement keyboard and mouse interactions for the `tree` composite widget, following the ARIA
 * Tree View pattern. Unlike the other composite widgets handled by the `Group` class, a tree
 * manages the focus (roving `tabindex`) and the selection separately, and it also supports
 * expanding and collapsing parent nodes.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */
export class Tree {
  /**
   * Initialize a new `Tree` instance.
   * @param {HTMLElement} parent Parent element.
   * @param {object} [options] Options.
   * @param {boolean} [options.clickToSelect] Whether to select an item by clicking on it.
   * @param {boolean} [options.selectionFollowsFocus] Whether to select an item as soon as it
   * receives focus. Default: `true` on a single-select tree, `false` on a multi-select tree.
   * @param {boolean} [options.expandOnSelect] Whether to expand or collapse a parent item when the
   * item itself, rather than its chevron, is clicked or activated.
   */
  constructor(parent, { clickToSelect = true, selectionFollowsFocus, expandOnSelect = true } = {}) {
    parent.dispatchEvent(new CustomEvent('Initializing'));

    this.parent = parent;
    this.id = generateElementId('tree');
    this.clickToSelect = clickToSelect;
    this.expandOnSelect = expandOnSelect;

    /**
     * Whether the selection follows the focus. `undefined` means auto detect.
     * @type {boolean | undefined}
     */
    this.selectionFollowsFocusOption = selectionFollowsFocus;

    /**
     * Item used as the starting point of a range selection.
     * @type {HTMLElement | undefined}
     */
    this.anchor = undefined;

    /**
     * Currently accumulated type-ahead search terms.
     * @type {string}
     */
    this.typeAheadTerms = '';

    /**
     * Timer used to reset the type-ahead search terms.
     * @type {ReturnType<typeof globalThis.setTimeout> | undefined}
     */
    this.typeAheadTimer = undefined;

    // eslint-disable-next-line jsdoc/require-description
    /** @type {(event: MouseEvent) => void} */
    this._onClick = (event) => {
      this.onClick(event);
    };

    // eslint-disable-next-line jsdoc/require-description
    /** @type {(event: KeyboardEvent) => void} */
    this._onKeyDown = (event) => {
      this.onKeyDown(event);
    };

    // eslint-disable-next-line jsdoc/require-description
    /** @type {(event: FocusEvent) => void} */
    this._onFocusIn = (event) => {
      this.onFocusIn(event);
    };

    // The items can be added or removed at any time, e.g. when a subtree is lazily rendered
    this.observer = new globalThis.MutationObserver(() => {
      this.update();
    });

    // The widget root itself is never part of the tab order; one of the items always is
    this.parent.tabIndex = -1;

    // Wait a bit before the child components are mounted
    (async () => {
      await sleep(100);
      this.activate();
    })();
  }

  /**
   * Activate the items.
   */
  activate() {
    const { parent } = this;

    this.update();

    parent.addEventListener('click', this._onClick);
    parent.addEventListener('keydown', this._onKeyDown);
    parent.addEventListener('focusin', this._onFocusIn);
    this.observer.observe(parent, { childList: true, subtree: true });
    parent.dispatchEvent(new CustomEvent('Initialized'));
  }

  /**
   * Whether more than one item can be selected.
   * @type {boolean}
   */
  get multi() {
    return this.parent.getAttribute('aria-multiselectable') === 'true';
  }

  /**
   * Whether an item is selected as soon as it receives focus.
   * @type {boolean}
   */
  get selectionFollowsFocus() {
    return this.selectionFollowsFocusOption ?? !this.multi;
  }

  /**
   * Whether the widget is disabled.
   * @type {boolean}
   */
  get isDisabled() {
    return this.parent.matches('[aria-disabled="true"]');
  }

  /**
   * Whether the widget is read-only.
   * @type {boolean}
   */
  get isReadOnly() {
    return this.parent.matches('[aria-readonly="true"]');
  }

  /**
   * List of all the items, including the ones within a collapsed parent, in document order.
   * @type {HTMLElement[]}
   */
  get allItems() {
    return /** @type {HTMLElement[]} */ ([...this.parent.querySelectorAll(ITEM_SELECTOR)]);
  }

  /**
   * List of the items that are not hidden, either explicitly or by a collapsed ancestor.
   * @type {HTMLElement[]}
   */
  get visibleItems() {
    return this.allItems.filter(
      (item) => !item.matches('[hidden], [aria-hidden="true"]') && !this.hasCollapsedAncestor(item),
    );
  }

  /**
   * List of the items that can receive focus.
   * @type {HTMLElement[]}
   */
  get activeItems() {
    return this.visibleItems.filter((item) => !item.matches('[aria-disabled="true"]'));
  }

  /**
   * List of the selected items.
   * @type {HTMLElement[]}
   */
  get selectedItems() {
    return this.allItems.filter((item) => item.matches('[aria-selected="true"]'));
  }

  /**
   * Item that is currently in the tab order, which is the item that has or last had focus.
   * @type {HTMLElement | undefined}
   */
  get currentItem() {
    return this.allItems.find((item) => item.tabIndex === 0);
  }

  /**
   * Get the group element that contains the child items of the given item.
   * @param {HTMLElement} item Parent item.
   * @returns {HTMLElement | undefined} Group element, if the item has one.
   */
  getGroup(item) {
    return /** @type {HTMLElement | undefined} */ (
      [...item.children].find((child) => child.getAttribute('role') === 'group')
    );
  }

  /**
   * Get the child items of the given item.
   * @param {HTMLElement} item Parent item.
   * @returns {HTMLElement[]} Child items. Empty if the item is a leaf node.
   */
  getChildItems(item) {
    const group = this.getGroup(item);

    return group ? this.getItemsInGroup(group) : [];
  }

  /**
   * Get the items directly owned by the given group, ignoring any deeper descendants.
   * @param {HTMLElement} group Group element or the widget root.
   * @returns {HTMLElement[]} Child items.
   */
  getItemsInGroup(group) {
    return /** @type {HTMLElement[]} */ ([...group.querySelectorAll(ITEM_SELECTOR)]).filter(
      (item) => item.parentElement?.closest(GROUP_SELECTOR) === group,
    );
  }

  /**
   * Get the parent item of the given item.
   * @param {HTMLElement} item Item.
   * @returns {HTMLElement | undefined} Parent item, if the item is not at the root level.
   */
  getParentItem(item) {
    return /** @type {HTMLElement | undefined} */ (
      item.parentElement?.closest(ITEM_SELECTOR) ?? undefined
    );
  }

  /**
   * Whether the given item is a parent node that can be expanded and collapsed.
   * @param {HTMLElement} item Item.
   * @returns {boolean} Result.
   */
  isParent(item) {
    return item.hasAttribute('aria-expanded');
  }

  /**
   * Whether the given parent item is expanded.
   * @param {HTMLElement} item Item.
   * @returns {boolean} Result.
   */
  isExpanded(item) {
    return item.getAttribute('aria-expanded') === 'true';
  }

  /**
   * Whether any of the ancestors of the given item is collapsed, meaning the item is not displayed.
   * @param {HTMLElement} item Item.
   * @returns {boolean} Result.
   */
  hasCollapsedAncestor(item) {
    let ancestor = this.getParentItem(item);

    while (ancestor) {
      if (!this.isExpanded(ancestor)) {
        return true;
      }

      ancestor = this.getParentItem(ancestor);
    }

    return false;
  }

  /**
   * Get the text label of the given item, which is used for the type-ahead search.
   * @param {HTMLElement} item Item.
   * @returns {string} Label.
   */
  getLabel(item) {
    return item.dataset.label ?? item.querySelector('.label')?.textContent ?? '';
  }

  /**
   * Assign the element IDs, positional attributes and roving `tabindex` to the items. Called
   * whenever the items are added or removed.
   */
  update() {
    const { allItems, activeItems } = this;

    allItems.forEach((item, index) => {
      item.id ||= `${this.id}-item-${index + 1}`;

      if (!item.hasAttribute('aria-selected')) {
        item.setAttribute('aria-selected', 'false');
      }
    });

    const groups = /** @type {HTMLElement[]} */ ([
      this.parent,
      ...this.parent.querySelectorAll('[role="group"]'),
    ]);

    groups.forEach((group) => {
      const items = this.getItemsInGroup(group);

      items.forEach((item, index) => {
        item.setAttribute('aria-posinset', String(index + 1));
        item.setAttribute('aria-setsize', String(items.length));
      });
    });

    // Keep exactly one item in the tab order, preferring the focused, current or selected one
    const current =
      activeItems.find((item) => item === document.activeElement) ??
      activeItems.find((item) => item.tabIndex === 0) ??
      activeItems.find((item) => item.matches('[aria-selected="true"]')) ??
      activeItems[0];

    allItems.forEach((item) => {
      item.tabIndex = item === current ? 0 : -1;
    });
  }

  /**
   * Scroll the given element into view if needed.
   * @param {HTMLElement} element Element to be scrolled into view.
   */
  scrollIntoView(element) {
    try {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    } catch {
      element.scrollIntoView(true);
    }
  }

  /**
   * Move focus to the given item.
   * @param {HTMLElement} item Item to be focused.
   * @param {object} [options] Options.
   * @param {boolean} [options.select] Whether to also select the item. Default: depends on the
   * `selectionFollowsFocus` option.
   */
  focusItem(item, { select = this.selectionFollowsFocus } = {}) {
    this.allItems.forEach((element) => {
      element.tabIndex = element === item ? 0 : -1;
    });

    item.focus();
    item.dispatchEvent(new CustomEvent('Focus'));
    this.scrollIntoView(item);

    if (select) {
      this.selectItem(item);
    }
  }

  /**
   * Update the selection state of the given item, and notify the change if needed.
   * @param {HTMLElement} item Item.
   * @param {boolean} selected Whether to select the item.
   */
  setSelected(item, selected) {
    if (item.matches('[aria-selected="true"]') === selected) {
      return;
    }

    item.setAttribute('aria-selected', String(selected));
    item.dispatchEvent(new CustomEvent('Change', { detail: { selected } }));

    if (selected) {
      item.dispatchEvent(new CustomEvent('Select'));
    }
  }

  /**
   * Select the given item.
   * @param {HTMLElement} item Item to be selected.
   * @param {object} [options] Options.
   * @param {boolean} [options.additive] Whether to toggle the item without deselecting the other
   * items. Multi-select only.
   * @param {boolean} [options.range] Whether to select all the items between the anchor and the
   * given item. Multi-select only.
   */
  selectItem(item, { additive = false, range = false } = {}) {
    if (this.isDisabled || this.isReadOnly) {
      return;
    }

    const { multi, anchor } = this;

    if (multi && range && anchor && anchor !== item) {
      const items = this.visibleItems;
      const indexes = [items.indexOf(anchor), items.indexOf(item)].sort((a, b) => a - b);

      items.forEach((element, index) => {
        this.setSelected(
          element,
          index >= indexes[0] && index <= indexes[1] && !element.matches('[aria-disabled="true"]'),
        );
      });
    } else if (multi && additive) {
      this.setSelected(item, !item.matches('[aria-selected="true"]'));
      this.anchor = item;
    } else {
      this.allItems.forEach((element) => {
        this.setSelected(element, element === item);
      });

      this.anchor = item;
    }

    this.parent.dispatchEvent(new CustomEvent('Change', { detail: getSelectedItemDetail(item) }));
  }

  /**
   * Select all the items that are currently displayed. Multi-select only.
   * @param {HTMLElement} item Item that triggered the action.
   */
  selectAll(item) {
    if (this.isDisabled || this.isReadOnly || !this.multi) {
      return;
    }

    this.activeItems.forEach((element) => {
      this.setSelected(element, true);
    });

    this.parent.dispatchEvent(new CustomEvent('Change', { detail: getSelectedItemDetail(item) }));
  }

  /**
   * Expand or collapse the given parent item.
   * @param {HTMLElement} item Item to be expanded or collapsed.
   * @param {boolean} expanded Whether to expand the item.
   */
  expandItem(item, expanded) {
    if (this.isDisabled || !this.isParent(item) || this.isExpanded(item) === expanded) {
      return;
    }

    const group = this.getGroup(item);

    // Update the DOM right away; the component will render the same state shortly
    item.setAttribute('aria-expanded', String(expanded));

    if (group) {
      group.hidden = !expanded;
    }

    item.dispatchEvent(new CustomEvent('Expand', { detail: { expanded } }));
    this.update();
  }

  /**
   * Expand all the sibling parent items at the same level as the given item.
   * @param {HTMLElement} item Item.
   */
  expandSiblings(item) {
    const parentItem = this.getParentItem(item);
    const group = parentItem ? this.getGroup(parentItem) : this.parent;

    if (!group) {
      return;
    }

    this.getItemsInGroup(group).forEach((sibling) => {
      this.expandItem(sibling, true);
    });
  }

  /**
   * Move focus to the next item that matches the accumulated type-ahead search terms.
   * @param {string} char Typed character.
   * @param {HTMLElement} currentItem Currently focused item.
   */
  typeAhead(char, currentItem) {
    globalThis.clearTimeout(this.typeAheadTimer);

    this.typeAheadTerms += char;
    this.typeAheadTimer = globalThis.setTimeout(() => {
      this.typeAheadTerms = '';
    }, TYPE_AHEAD_TIMEOUT);

    const terms = normalize(this.typeAheadTerms);
    const items = this.activeItems;
    const index = items.indexOf(currentItem);

    // Start the search right after the current item, so repeatedly typing the same character
    // cycles through the matches. Keep the current item first while the terms are being extended.
    const orderedItems = [
      ...(terms.length > 1 ? [currentItem] : []),
      ...items.slice(index + 1),
      ...items.slice(0, index + 1),
    ];

    const match = orderedItems.find((item) => normalize(this.getLabel(item)).startsWith(terms));

    if (match && match !== currentItem) {
      this.focusItem(match);
    }
  }

  /**
   * Handle the `focusin` event on the widget. Make the newly focused item the only one in the tab
   * order, so that Shift+Tab and Tab move focus out of the widget.
   * @param {FocusEvent} event `focusin` event.
   */
  onFocusIn(event) {
    const item = /** @type {HTMLElement | null} */ (
      /** @type {HTMLElement} */ (event.target).closest(ITEM_SELECTOR)
    );

    if (!item) {
      return;
    }

    this.allItems.forEach((element) => {
      element.tabIndex = element === item ? 0 : -1;
    });
  }

  /**
   * Handle the `click` event on the widget.
   * @param {MouseEvent} event `click` event.
   */
  onClick(event) {
    // eslint-disable-next-line prefer-destructuring
    const target = /** @type {HTMLElement} */ (event.target);
    const item = /** @type {HTMLElement | null} */ (target.closest(ITEM_SELECTOR));

    if (!item || event.button !== 0 || this.isDisabled) {
      return;
    }

    if (item.matches('[aria-disabled="true"]')) {
      event.preventDefault();

      return;
    }

    const { ctrlKey, metaKey, shiftKey } = event;

    // The chevron only expands or collapses the item
    if (target.closest('[data-action="toggle"]')) {
      event.preventDefault();
      this.focusItem(item, { select: false });
      this.expandItem(item, !this.isExpanded(item));

      return;
    }

    this.focusItem(item, { select: false });

    if (this.clickToSelect) {
      this.selectItem(item, { additive: ctrlKey || metaKey, range: shiftKey });
    }

    if (this.expandOnSelect && !ctrlKey && !metaKey && !shiftKey) {
      this.expandItem(item, !this.isExpanded(item));
    }
  }

  /**
   * Handle the `keydown` event on the widget.
   * @param {KeyboardEvent} event `keydown` event.
   */
  onKeyDown(event) {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const { activeItems, multi } = this;

    if (this.isDisabled || altKey || !activeItems.length) {
      return;
    }

    const target = /** @type {HTMLElement | null} */ (
      /** @type {HTMLElement} */ (event.target).closest(ITEM_SELECTOR)
    );

    const currentItem = target ?? this.currentItem ?? activeItems[0];
    const index = activeItems.indexOf(currentItem);
    // In RTL, the Left and Right arrow keys are swapped
    const forwardKey = isRTL() ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isRTL() ? 'ArrowRight' : 'ArrowLeft';

    if (key === 'a' && (ctrlKey || metaKey)) {
      if (multi) {
        event.preventDefault();
        this.selectAll(currentItem);
      }

      return;
    }

    if (ctrlKey || metaKey) {
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      // Also trigger any custom `onclick` handler on the item
      currentItem.click();

      return;
    }

    if (key === ' ') {
      event.preventDefault();

      if (multi) {
        this.selectItem(currentItem, { additive: !shiftKey, range: shiftKey });
      } else {
        this.selectItem(currentItem);
      }

      return;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();

      const newItem = activeItems[key === 'ArrowDown' ? index + 1 : index - 1];

      if (!newItem) {
        return;
      }

      if (multi && shiftKey) {
        this.focusItem(newItem, { select: false });
        this.selectItem(newItem, { additive: true });
      } else {
        this.focusItem(newItem);
      }

      return;
    }

    if (key === forwardKey) {
      event.preventDefault();

      if (!this.isParent(currentItem)) {
        return;
      }

      if (!this.isExpanded(currentItem)) {
        this.expandItem(currentItem, true);

        return;
      }

      const childItem = this.getChildItems(currentItem).find((item) => activeItems.includes(item));

      if (childItem) {
        this.focusItem(childItem);
      }

      return;
    }

    if (key === backwardKey) {
      event.preventDefault();

      if (this.isParent(currentItem) && this.isExpanded(currentItem)) {
        this.expandItem(currentItem, false);

        return;
      }

      const parentItem = this.getParentItem(currentItem);

      if (parentItem && activeItems.includes(parentItem)) {
        this.focusItem(parentItem);
      }

      return;
    }

    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      this.focusItem(key === 'Home' ? activeItems[0] : activeItems[activeItems.length - 1]);

      return;
    }

    if (key === '*') {
      event.preventDefault();
      this.expandSiblings(currentItem);

      return;
    }

    if (key.length === 1 && key.trim()) {
      this.typeAhead(key, currentItem);
    }
  }

  /**
   * Clean up event listeners.
   */
  destroy() {
    globalThis.clearTimeout(this.typeAheadTimer);
    this.observer.disconnect();
    this.parent.removeEventListener('click', this._onClick);
    this.parent.removeEventListener('keydown', this._onKeyDown);
    this.parent.removeEventListener('focusin', this._onFocusIn);
  }
}

/**
 * Activate a new tree.
 * @param {object} [params] Params to be passed to the `Tree` constructor.
 * @returns {Attachment} Attachment.
 */
export const activateTree = (params) => (parent) => {
  const tree = new Tree(/** @type {HTMLElement} */ (parent), params);

  return () => {
    tree.destroy();
  };
};
