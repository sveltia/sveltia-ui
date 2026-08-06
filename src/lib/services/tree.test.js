import { locale } from '@sveltia/i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateTree, Tree } from './tree.svelte.js';

/**
 * @typedef {object} ItemOptions
 * @property {boolean} [expanded] Whether the item is a parent node, and whether it’s expanded.
 * @property {boolean} [disabled] Whether the item is disabled.
 * @property {boolean} [selected] Whether the item is selected.
 */

/**
 * Create a tree item that mimics the `<TreeItem>` component’s markup.
 * @param {string} label Text label.
 * @param {ItemOptions} [options] Options.
 * @returns {HTMLElement} Item element.
 */
const createItem = (label, { expanded, disabled, selected } = {}) => {
  const item = document.createElement('div');
  const row = document.createElement('div');
  const chevron = document.createElement('span');
  const labelElement = document.createElement('span');

  item.setAttribute('role', 'treeitem');
  item.tabIndex = -1;
  item.dataset.label = label;
  row.className = 'row';
  chevron.className = 'chevron';
  chevron.dataset.action = 'toggle';
  labelElement.className = 'label';
  labelElement.textContent = label;
  row.append(chevron, labelElement);
  item.append(row);

  if (selected) {
    item.setAttribute('aria-selected', 'true');
  }

  if (disabled) {
    item.setAttribute('aria-disabled', 'true');
  }

  if (expanded !== undefined) {
    const group = document.createElement('div');

    group.setAttribute('role', 'group');
    group.hidden = !expanded;
    item.setAttribute('aria-expanded', String(expanded));
    item.append(group);
  }

  return item;
};

/**
 * Add the given child items to the given parent item.
 * @param {HTMLElement} parentItem Parent item.
 * @param {HTMLElement[]} childItems Child items.
 */
const appendChildItems = (parentItem, childItems) => {
  /** @type {HTMLElement} */ (parentItem.querySelector('[role="group"]')).append(...childItems);
};

/**
 * Dispatch a `keydown` event on the given element.
 * @param {HTMLElement} element Target element.
 * @param {string} key Key name.
 * @param {KeyboardEventInit} [options] Extra options.
 */
const keyDown = (element, key, options = {}) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
};

/**
 * Dispatch a `click` event on the given element.
 * @param {HTMLElement} element Target element.
 * @param {MouseEventInit} [options] Extra options.
 */
const click = (element, options = {}) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, ...options }));
};

describe('Tree', () => {
  /** @type {HTMLElement} */
  let tree;
  /** @type {Record<string, HTMLElement>} */
  let items;
  /** @type {() => void} */
  let cleanup;

  /**
   * Build a tree with an expanded `Documents` item containing a collapsed `Reports` item (with the
   * `Q1` and `Q2` children) and a `Notes` item, followed by a collapsed `Pictures` item (with a
   * `Beach` child), a `Readme` item and a disabled `Archive` item.
   * @param {object} [options] Options.
   * @param {boolean} [options.multiple] Whether to allow multiple selection.
   * @param {object} [options.params] Params to be passed to the `Tree` constructor.
   */
  const setup = async ({ multiple = false, params = {} } = {}) => {
    tree = document.createElement('div');
    tree.setAttribute('role', 'tree');

    if (multiple) {
      tree.setAttribute('aria-multiselectable', 'true');
    }

    items = {
      documents: createItem('Documents', { expanded: true }),
      reports: createItem('Reports', { expanded: false }),
      q1: createItem('Q1'),
      q2: createItem('Q2'),
      notes: createItem('Notes'),
      pictures: createItem('Pictures', { expanded: false }),
      beach: createItem('Beach'),
      readme: createItem('Readme'),
      archive: createItem('Archive', { disabled: true }),
    };

    appendChildItems(items.reports, [items.q1, items.q2]);
    appendChildItems(items.documents, [items.reports, items.notes]);
    appendChildItems(items.pictures, [items.beach]);
    tree.append(items.documents, items.pictures, items.readme, items.archive);
    document.body.append(tree);
    cleanup = /** @type {() => void} */ (activateTree(params)(tree));
    await vi.advanceTimersByTimeAsync(150);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup?.();
    tree?.remove();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should assign element IDs to all the items', () => {
      Object.values(items).forEach((item) => {
        expect(item.id).toBeTruthy();
      });
    });

    it('should remove the widget root from the tab order', () => {
      expect(tree.tabIndex).toBe(-1);
    });

    it('should make only the first item tabbable', () => {
      expect(items.documents.tabIndex).toBe(0);
      expect(items.reports.tabIndex).toBe(-1);
      expect(items.readme.tabIndex).toBe(-1);
    });

    it('should default the selection state to false', () => {
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });

    it('should set the positional attributes based on the DOM structure', () => {
      expect(items.documents.getAttribute('aria-posinset')).toBe('1');
      expect(items.documents.getAttribute('aria-setsize')).toBe('4');
      expect(items.archive.getAttribute('aria-posinset')).toBe('4');
      expect(items.q1.getAttribute('aria-posinset')).toBe('1');
      expect(items.q1.getAttribute('aria-setsize')).toBe('2');
      expect(items.beach.getAttribute('aria-setsize')).toBe('1');
    });

    it('should make an already selected item tabbable', async () => {
      cleanup();
      tree.remove();
      await setup();
      // Rebuild with a selected item
      cleanup();
      tree.remove();
      tree = document.createElement('div');
      tree.setAttribute('role', 'tree');
      items = { one: createItem('One'), two: createItem('Two', { selected: true }) };
      tree.append(items.one, items.two);
      document.body.append(tree);
      cleanup = /** @type {() => void} */ (activateTree()(tree));
      await vi.advanceTimersByTimeAsync(150);
      expect(items.two.tabIndex).toBe(0);
      expect(items.one.tabIndex).toBe(-1);
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should move focus to the next visible item with ArrowDown', () => {
      keyDown(items.documents, 'ArrowDown');
      expect(document.activeElement).toBe(items.reports);
      keyDown(items.reports, 'ArrowDown');
      // The children of the collapsed Reports item are skipped
      expect(document.activeElement).toBe(items.notes);
    });

    it('should move focus to the previous visible item with ArrowUp', () => {
      keyDown(items.documents, 'ArrowDown');
      keyDown(items.reports, 'ArrowUp');
      expect(document.activeElement).toBe(items.documents);
    });

    it('should not wrap around at the beginning or the end', () => {
      keyDown(items.documents, 'ArrowUp');
      expect(document.activeElement).not.toBe(items.readme);
    });

    it('should skip a disabled item', () => {
      keyDown(items.documents, 'End');
      expect(document.activeElement).toBe(items.readme);
    });

    it('should move focus to the first and last visible items with Home and End', () => {
      keyDown(items.documents, 'End');
      expect(document.activeElement).toBe(items.readme);
      keyDown(items.readme, 'Home');
      expect(document.activeElement).toBe(items.documents);
    });

    it('should expand a collapsed item with ArrowRight', () => {
      keyDown(items.reports, 'ArrowRight');
      expect(items.reports.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).not.toBe(items.q1);
    });

    it('should move focus to the first child of an expanded item with ArrowRight', () => {
      keyDown(items.documents, 'ArrowRight');
      expect(document.activeElement).toBe(items.reports);
    });

    it('should do nothing on a leaf item with ArrowRight', () => {
      keyDown(items.readme, 'ArrowRight');
      expect(items.readme.hasAttribute('aria-expanded')).toBe(false);
    });

    it('should collapse an expanded item with ArrowLeft', () => {
      keyDown(items.documents, 'ArrowLeft');
      expect(items.documents.getAttribute('aria-expanded')).toBe('false');
    });

    it('should move focus to the parent item with ArrowLeft', () => {
      keyDown(items.notes, 'ArrowLeft');
      expect(document.activeElement).toBe(items.documents);
    });

    it('should expand all the sibling items with the asterisk key', () => {
      keyDown(items.documents, '*');
      expect(items.documents.getAttribute('aria-expanded')).toBe('true');
      expect(items.pictures.getAttribute('aria-expanded')).toBe('true');
      // Items at a different level are not affected
      expect(items.reports.getAttribute('aria-expanded')).toBe('false');
    });

    it('should keep only the focused item in the tab order', () => {
      keyDown(items.documents, 'ArrowDown');
      expect(items.documents.tabIndex).toBe(-1);
      expect(items.reports.tabIndex).toBe(0);
    });
  });

  describe('type-ahead', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should move focus to the next item that starts with the typed character', () => {
      keyDown(items.documents, 'r');
      expect(document.activeElement).toBe(items.reports);
    });

    it('should support multiple characters', () => {
      keyDown(items.documents, 'r');
      keyDown(items.reports, 'e');
      expect(document.activeElement).toBe(items.reports);
    });

    it('should reset the search terms after a timeout', async () => {
      keyDown(items.documents, 'p');
      expect(document.activeElement).toBe(items.pictures);
      await vi.advanceTimersByTimeAsync(600);
      keyDown(items.pictures, 'r');
      expect(document.activeElement).toBe(items.readme);
    });

    it('should ignore hidden items', () => {
      keyDown(items.documents, 'q');
      expect(document.activeElement).not.toBe(items.q1);
    });
  });

  describe('single selection', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should select an item on click', () => {
      click(items.readme);
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
    });

    it('should deselect the other items', () => {
      click(items.readme);
      click(items.notes);
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
      expect(items.notes.getAttribute('aria-selected')).toBe('true');
    });

    it('should select an item as focus moves', () => {
      keyDown(items.documents, 'ArrowDown');
      expect(items.reports.getAttribute('aria-selected')).toBe('true');
    });

    it('should select an item with the Space key', () => {
      keyDown(items.readme, ' ');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
    });

    it('should dispatch the Change event on the widget root', () => {
      const onChange = vi.fn();

      tree.addEventListener('Change', onChange);
      click(items.readme);
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0][0].detail.label).toBe('Readme');
    });

    it('should dispatch the Change and Select events on the item', () => {
      const onChange = vi.fn();
      const onSelect = vi.fn();

      items.readme.addEventListener('Change', onChange);
      items.readme.addEventListener('Select', onSelect);
      click(items.readme);
      expect(onChange.mock.calls[0][0].detail).toEqual({ selected: true });
      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('should ignore a disabled item', () => {
      click(items.archive);
      expect(items.archive.getAttribute('aria-selected')).toBe('false');
    });

    it('should not select an item when clickToSelect is false', async () => {
      cleanup();
      tree.remove();
      await setup({ params: { clickToSelect: false } });
      click(items.readme);
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
      expect(document.activeElement).toBe(items.readme);
    });
  });

  describe('multiple selection', () => {
    beforeEach(async () => {
      await setup({ multiple: true });
    });

    it('should not select an item as focus moves', () => {
      keyDown(items.documents, 'ArrowDown');
      expect(items.reports.getAttribute('aria-selected')).toBe('false');
    });

    it('should toggle the selection state with the Space key', () => {
      keyDown(items.readme, ' ');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
      keyDown(items.readme, ' ');
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });

    it('should keep the other items selected', () => {
      keyDown(items.readme, ' ');
      keyDown(items.notes, ' ');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
      expect(items.notes.getAttribute('aria-selected')).toBe('true');
    });

    it('should extend the selection with Shift+ArrowDown', () => {
      keyDown(items.documents, ' ');
      keyDown(items.documents, 'ArrowDown', { shiftKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('true');
      expect(items.reports.getAttribute('aria-selected')).toBe('true');
    });

    it('should select a range with Shift+click', () => {
      click(items.notes);
      click(items.readme, { shiftKey: true });
      expect(items.notes.getAttribute('aria-selected')).toBe('true');
      expect(items.pictures.getAttribute('aria-selected')).toBe('true');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
      // Items outside the range are deselected, and disabled items are skipped
      expect(items.documents.getAttribute('aria-selected')).toBe('false');
      expect(items.archive.getAttribute('aria-selected')).toBe('false');
    });

    it('should toggle a single item with Ctrl+click', () => {
      click(items.documents);
      click(items.readme, { ctrlKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('true');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
      click(items.readme, { ctrlKey: true });
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });

    it('should select all the visible items with Cmd+A', () => {
      keyDown(items.documents, 'a', { metaKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('true');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
    });

    it('should select all the visible items with Ctrl+A', () => {
      keyDown(items.documents, 'a', { ctrlKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('true');
      expect(items.readme.getAttribute('aria-selected')).toBe('true');
      // Hidden and disabled items are not selected
      expect(items.q1.getAttribute('aria-selected')).toBe('false');
      expect(items.archive.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('expansion', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should toggle a parent item on click', () => {
      click(items.pictures);
      expect(items.pictures.getAttribute('aria-expanded')).toBe('true');
      click(items.pictures);
      expect(items.pictures.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show and hide the group element', () => {
      const group = /** @type {HTMLElement} */ (items.pictures.querySelector('[role="group"]'));

      expect(group.hidden).toBe(true);
      click(items.pictures);
      expect(group.hidden).toBe(false);
    });

    it('should dispatch the Expand event', () => {
      const onExpand = vi.fn();

      items.pictures.addEventListener('Expand', onExpand);
      click(items.pictures);
      expect(onExpand.mock.calls[0][0].detail).toEqual({ expanded: true });
    });

    it('should only toggle the item when the chevron is clicked', () => {
      const chevron = /** @type {HTMLElement} */ (items.pictures.querySelector('.chevron'));

      click(chevron);
      expect(items.pictures.getAttribute('aria-expanded')).toBe('true');
      expect(items.pictures.getAttribute('aria-selected')).toBe('false');
    });

    it('should not toggle the item when expandOnSelect is false', async () => {
      cleanup();
      tree.remove();
      await setup({ params: { expandOnSelect: false } });
      click(items.pictures);
      expect(items.pictures.getAttribute('aria-expanded')).toBe('false');
      expect(items.pictures.getAttribute('aria-selected')).toBe('true');
    });

    it('should activate the item with the Enter key', () => {
      keyDown(items.pictures, 'Enter');
      expect(items.pictures.getAttribute('aria-expanded')).toBe('true');
      expect(items.pictures.getAttribute('aria-selected')).toBe('true');
    });

    it('should move the tab order out of a collapsed subtree', () => {
      click(items.beach);
      expect(items.beach.tabIndex).toBe(0);
      keyDown(items.beach, 'ArrowLeft');
      keyDown(items.pictures, 'ArrowLeft');
      expect(items.pictures.getAttribute('aria-expanded')).toBe('false');
      expect(items.beach.tabIndex).toBe(-1);
      expect(items.pictures.tabIndex).toBe(0);
    });
  });

  describe('disabled and read-only widget', () => {
    it('should ignore all the interactions when disabled', async () => {
      await setup();
      tree.setAttribute('aria-disabled', 'true');
      click(items.readme);
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
      keyDown(items.documents, 'ArrowDown');
      expect(document.activeElement).not.toBe(items.reports);
    });

    it('should allow navigating but not selecting when read-only', async () => {
      await setup();
      tree.setAttribute('aria-readonly', 'true');
      keyDown(items.documents, 'ArrowDown');
      expect(document.activeElement).toBe(items.reports);
      expect(items.reports.getAttribute('aria-selected')).toBe('false');
    });

    it('should not select all the items with Ctrl+A when read-only', async () => {
      await setup({ multiple: true });
      tree.setAttribute('aria-readonly', 'true');
      keyDown(items.documents, 'a', { ctrlKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('false');
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await setup();
    });

    it('should fall back to the current item when the event target is not an item', () => {
      // The widget root can receive the event when the focus is yet to be moved to an item
      keyDown(tree, 'ArrowDown');
      expect(document.activeElement).toBe(items.reports);
    });

    it('should ignore a modified key combination other than Ctrl+A', () => {
      keyDown(items.documents, 'ArrowDown', { ctrlKey: true });
      expect(document.activeElement).not.toBe(items.reports);
      keyDown(items.documents, 'ArrowDown', { metaKey: true });
      expect(document.activeElement).not.toBe(items.reports);
    });

    it('should ignore the focusin event fired on a non-item element', () => {
      tree.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(items.documents.tabIndex).toBe(0);
      expect(items.reports.tabIndex).toBe(-1);
    });

    it('should fall back to the legacy scrollIntoView argument', () => {
      const scrollIntoView = vi.fn((/** @type {any} */ options) => {
        if (typeof options === 'object') {
          throw new TypeError('Unsupported');
        }
      });

      items.readme.scrollIntoView = scrollIntoView;
      click(items.readme);
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      expect(scrollIntoView).toHaveBeenLastCalledWith(true);
    });

    it('should ignore the asterisk key when the parent item has no group', () => {
      const parentItem = createItem('Wrapper', { expanded: true });
      const childItem = createItem('Nested', { expanded: false });

      // Nest an item directly within another item, without the intermediate group element
      /** @type {HTMLElement} */ (parentItem.querySelector('[role="group"]')).remove();
      parentItem.append(childItem);
      tree.append(parentItem);
      keyDown(childItem, '*');
      expect(childItem.getAttribute('aria-expanded')).toBe('false');
    });

    it('should handle a parent item that has no group', () => {
      const parentItem = createItem('Wrapper', { expanded: false });

      /** @type {HTMLElement} */ (parentItem.querySelector('[role="group"]')).remove();
      tree.append(parentItem);
      // The item can still be expanded, but there is no child item to move focus to
      click(parentItem);
      expect(parentItem.getAttribute('aria-expanded')).toBe('true');
      keyDown(parentItem, 'ArrowRight');
      expect(document.activeElement).toBe(parentItem);
    });

    it('should fall back to the first item when no item is in the tab order', () => {
      Object.values(items).forEach((item) => {
        item.tabIndex = -1;
      });
      keyDown(tree, 'ArrowDown');
      expect(document.activeElement).toBe(items.reports);
    });

    it('should ignore Ctrl+A on a single-select widget', () => {
      keyDown(items.documents, 'a', { ctrlKey: true });
      expect(items.documents.getAttribute('aria-selected')).toBe('false');
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });

    it('should ignore an unhandled key', () => {
      keyDown(items.documents, 'Escape');
      expect(document.activeElement).not.toBe(items.reports);
    });

    it('should search by the rendered label when the data attribute is missing', () => {
      const newItem = createItem('Videos');

      delete newItem.dataset.label;
      tree.append(newItem);
      keyDown(items.documents, 'v');
      expect(document.activeElement).toBe(newItem);
    });

    it('should search by an empty label when the item has no label element', () => {
      const newItem = createItem('Videos');

      delete newItem.dataset.label;
      /** @type {HTMLElement} */ (newItem.querySelector('.label')).remove();
      tree.append(newItem);
      keyDown(items.documents, 'v');
      expect(document.activeElement).not.toBe(newItem);
    });
  });

  describe('right-to-left locale', () => {
    beforeEach(async () => {
      locale.set('ar');
      await setup();
    });

    afterEach(() => {
      locale.set('en');
    });

    it('should expand an item with ArrowLeft', () => {
      keyDown(items.pictures, 'ArrowLeft');
      expect(items.pictures.getAttribute('aria-expanded')).toBe('true');
      keyDown(items.pictures, 'ArrowLeft');
      expect(document.activeElement).toBe(items.beach);
    });

    it('should collapse an item with ArrowRight', () => {
      keyDown(items.documents, 'ArrowRight');
      expect(items.documents.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('dynamic items', () => {
    it('should activate items added after the initialization', async () => {
      await setup();

      const newItem = createItem('Videos');

      tree.append(newItem);
      await vi.advanceTimersByTimeAsync(0);
      expect(newItem.id).toBeTruthy();
      expect(newItem.getAttribute('aria-selected')).toBe('false');
      expect(newItem.getAttribute('aria-setsize')).toBe('5');
    });
  });

  describe('destroy', () => {
    it('should remove the event listeners', async () => {
      await setup();
      cleanup();
      click(items.readme);
      expect(items.readme.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('instance', () => {
    it('should expose the selected items', async () => {
      await setup();

      const instance = new Tree(tree);

      await vi.advanceTimersByTimeAsync(150);
      click(items.readme);
      expect(instance.selectedItems).toEqual([items.readme]);
      expect(instance.activeItems).not.toContain(items.archive);
      expect(instance.visibleItems).not.toContain(items.q1);
      instance.destroy();
    });
  });
});
