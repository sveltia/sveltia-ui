import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import TreeItem from './tree-item.svelte';
import { setRTL } from '../../test-utils/locale.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('TreeItem', () => {
  afterEach(() => {
    setRTL(false);
  });

  it('mirrors the chevron in a right-to-left locale', async () => {
    setRTL(true);

    const screen = await render(TreeItem, {
      label: 'Documents',
      items: html('<div role="treeitem">Child</div>'),
    });

    expect(screen.container.querySelector('.chevron .icon')?.textContent?.trim()).toBe(
      'chevron_left',
    );
  });

  it('renders a leaf item with the label as the default value', async () => {
    const screen = await render(TreeItem, { label: 'Report', class: 'custom', 'data-x': '1' });
    const item = screen.getByRole('treeitem', { name: 'Report' });
    const element = /** @type {HTMLElement} */ (item.element());

    await expect.element(item).toHaveClass('sui', 'treeitem', 'custom');
    await expect.element(item).toHaveAttribute('tabindex', '-1');
    await expect.element(item).toHaveAttribute('aria-selected', 'false');
    await expect.element(item).toHaveAttribute('aria-level', '1');
    await expect.element(item).toHaveAttribute('aria-hidden', 'false');
    await expect.element(item).toHaveAttribute('aria-disabled', 'false');
    await expect.element(item).toHaveAttribute('data-label', 'Report');
    await expect.element(item).toHaveAttribute('data-value', 'Report');
    await expect.element(item).toHaveAttribute('data-type', 'string');
    await expect.element(item).toHaveAttribute('data-x', '1');
    expect(element.hasAttribute('aria-expanded')).toBe(false);
    expect(element.getAttribute('aria-labelledby')).toBe(element.querySelector('.label')?.id);
    expect(element.querySelector('.chevron.placeholder')).not.toBeNull();
    expect(element.querySelector('[data-action="toggle"]')).toBeNull();
    expect(element.querySelector('[role="group"]')).toBeNull();
    expect(
      /** @type {HTMLElement} */ (element.querySelector('.row')).style.getPropertyValue(
        '--sui-tree-item-level',
      ),
    ).toBe('1');
  });

  it('uses the given value and type, and renders children instead of a label', async () => {
    const screen = await render(TreeItem, { value: 42, children: text('Custom') });
    const item = screen.getByRole('treeitem', { name: 'Custom' });

    await expect.element(item).toHaveAttribute('data-value', '42');
    await expect.element(item).toHaveAttribute('data-type', 'number');
  });

  it('renders a parent item with a chevron and a collapsed group', async () => {
    const screen = await render(TreeItem, {
      label: 'Documents',
      items: html('<div role="treeitem" class="child">Child</div>'),
      startIcon: html('<i class="start">S</i>'),
      endIcon: html('<i class="end">E</i>'),
    });

    const item = screen.getByRole('treeitem', { name: 'Documents' });
    const element = /** @type {HTMLElement} */ (item.element());
    const group = /** @type {HTMLElement} */ (element.querySelector('[role="group"]'));

    await expect.element(item).toHaveAttribute('aria-expanded', 'false');
    expect(element.querySelector('.chevron[data-action="toggle"] .icon')?.textContent?.trim()).toBe(
      'chevron_right',
    );
    expect(group.hidden).toBe(true);
    expect(group.querySelector('.child')).not.toBeNull();
    expect(element.querySelector('.row .start')).not.toBeNull();
    expect(element.querySelector('.row .end')).not.toBeNull();
  });

  it('renders a custom chevron, and shows the group while expanded', async () => {
    const screen = await render(TreeItem, {
      label: 'Documents',
      expanded: true,
      items: html('<div role="treeitem">Child</div>'),
      chevronIcon: html('<i class="chevron-icon">></i>'),
    });

    const element = /** @type {HTMLElement} */ (
      screen.container.querySelector('[role="treeitem"]')
    );

    expect(element.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.chevron .chevron-icon')).not.toBeNull();
    expect(/** @type {HTMLElement} */ (element.querySelector('[role="group"]')).hidden).toBe(false);
  });

  it('nests the level through the context', async () => {
    const screen = await render(TreeItem, {
      label: 'Root',
      expanded: true,
      items: html('<div role="none">placeholder</div>'),
    });

    // Mount a child within the parent’s group to pick up its level
    const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="group"]'));

    expect(group).not.toBeNull();
  });

  it('follows the events dispatched by the parent tree', async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const onExpand = vi.fn();

    /** @type {ComponentProps<typeof TreeItem>} */
    const props = $state({
      label: 'Documents',
      selected: false,
      expanded: false,
      items: html('<div role="treeitem">Child</div>'),
      onChange,
      onSelect,
      onExpand,
    });

    const screen = await render(TreeItem, props);

    const element = /** @type {HTMLElement} */ (
      screen.container.querySelector('[role="treeitem"]')
    );

    element.dispatchEvent(new CustomEvent('Change', { detail: { selected: true } }));
    expect(props.selected).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();

    element.dispatchEvent(new CustomEvent('Expand', { detail: { expanded: true } }));
    expect(props.expanded).toBe(true);
    expect(onExpand).toHaveBeenCalledOnce();

    element.dispatchEvent(new CustomEvent('Select'));
    expect(onSelect).toHaveBeenCalledOnce();

    await vi.waitFor(() => {
      expect(element.getAttribute('aria-selected')).toBe('true');
      expect(element.getAttribute('aria-expanded')).toBe('true');
    });
  });

  it('reflects the hidden and disabled states', async () => {
    const screen = await render(TreeItem, { label: 'Report', hidden: true, disabled: true });

    const element = /** @type {HTMLElement} */ (
      screen.container.querySelector('[role="treeitem"]')
    );

    expect(element.hidden).toBe(true);
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('aria-disabled')).toBe('true');
  });
});
