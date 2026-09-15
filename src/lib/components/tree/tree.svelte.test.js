import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { whenActivated } from '../../test-utils/group.js';
import { text } from '../../test-utils/snippets.js';
import TreeFixture from './tree-fixture.test.svelte';
import Tree from './tree.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Render the tree fixture and wait for it to become interactive.
 * @param {ComponentProps<typeof TreeFixture>} [props] Props.
 * @returns {Promise<Awaited<ReturnType<typeof render<typeof TreeFixture>>>>} Rendered fixture.
 */
const renderTree = async (props = {}) => {
  const activated = whenActivated();
  const screen = await render(TreeFixture, props);

  await activated;

  return screen;
};

describe('Tree', () => {
  it('renders a tree with the state attributes and exposes its element', async () => {
    /** @type {ComponentProps<typeof Tree>} */
    const props = $state({
      element: undefined,
      ariaLabel: 'Files',
      class: 'custom',
      multiple: true,
      readonly: true,
      children: text('child'),
    });

    const screen = await render(Tree, props);
    const tree = screen.getByRole('tree', { name: 'Files' });

    await expect.element(tree).toHaveClass('sui', 'tree', 'custom');
    await expect.element(tree).toHaveAttribute('aria-multiselectable', 'true');
    await expect.element(tree).toHaveAttribute('aria-readonly', 'true');
    await expect.element(tree).toHaveAttribute('aria-hidden', 'false');
    await expect.element(tree).toHaveAttribute('aria-disabled', 'false');
    expect(props.element).toBe(tree.element());
    expect(tree.element().textContent).toContain('child');
  });

  it('omits the read-only attribute unless read-only, and hides and disables the tree', async () => {
    const screen = await render(Tree, { hidden: true, disabled: true });
    const tree = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tree"]'));

    expect(tree.hasAttribute('aria-readonly')).toBe(false);
    expect(tree.hidden).toBe(true);
    expect(tree.getAttribute('aria-hidden')).toBe('true');
    expect(tree.getAttribute('aria-disabled')).toBe('true');
    expect(tree.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
  });

  it('selects items when clicked, expanding a parent item', async () => {
    const onChange = vi.fn();
    const onItemChange = vi.fn();
    const onItemSelect = vi.fn();
    const onItemExpand = vi.fn();

    /** @type {ComponentProps<typeof TreeFixture>} */
    const props = $state({
      expanded: false,
      selected: false,
      onChange,
      onItemChange,
      onItemSelect,
      onItemExpand,
    });

    const screen = await renderTree(props);
    const documents = screen.getByRole('treeitem', { name: 'Documents' });
    const pictures = screen.getByRole('treeitem', { name: 'Pictures' });

    await expect.element(documents).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen
        .getByRole('treeitem', { name: 'Report', includeHidden: true })
        .element()
        .checkVisibility(),
    ).toBe(false);

    await documents.click();
    await expect.element(documents).toHaveAttribute('aria-selected', 'true');
    await expect.element(documents).toHaveAttribute('aria-expanded', 'true');
    expect(props.selected).toBe(true);
    expect(props.expanded).toBe(true);
    expect(onItemChange).toHaveBeenCalled();
    expect(onItemSelect).toHaveBeenCalled();
    expect(onItemExpand).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.lastCall?.[0].detail.value).toBe('docs');
    await expect.element(screen.getByRole('treeitem', { name: 'Report' })).toBeVisible();

    await pictures.click();
    await expect.element(pictures).toHaveAttribute('aria-selected', 'true');
    await expect.element(documents).toHaveAttribute('aria-selected', 'false');
    expect(props.selected).toBe(false);
  });

  it('toggles a parent item with its chevron without selecting it', async () => {
    /** @type {ComponentProps<typeof TreeFixture>} */
    const props = $state({ expanded: false, selected: false });
    const screen = await renderTree(props);
    const documents = screen.getByRole('treeitem', { name: 'Documents' });
    const chevron = /** @type {HTMLElement} */ (documents.element().querySelector('.chevron'));

    chevron.click();
    await expect.element(documents).toHaveAttribute('aria-expanded', 'true');
    expect(props.expanded).toBe(true);
    expect(props.selected).toBe(false);
    chevron.click();
    await expect.element(documents).toHaveAttribute('aria-expanded', 'false');
  });

  it('navigates and expands with the keyboard', async () => {
    /** @type {ComponentProps<typeof TreeFixture>} */
    const props = $state({ expanded: false });
    const screen = await renderTree(props);
    const documents = screen.getByRole('treeitem', { name: 'Documents' });
    const report = screen.getByRole('treeitem', { name: 'Report' });
    const pictures = screen.getByRole('treeitem', { name: 'Pictures' });

    await expect.element(documents).toHaveAttribute('tabindex', '0');
    /** @type {HTMLElement} */ (documents.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(documents).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(report.element());
    });
    await expect.element(report).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(pictures.element());
    });
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(documents.element());
    });
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(documents).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports selecting several items', async () => {
    const screen = await renderTree({ multiple: true });
    const documents = screen.getByRole('treeitem', { name: 'Documents' });
    const pictures = screen.getByRole('treeitem', { name: 'Pictures' });

    await documents.click();
    await pictures.click({ modifiers: ['ControlOrMeta'] });
    await expect.element(documents).toHaveAttribute('aria-selected', 'true');
    await expect.element(pictures).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores clicks while read-only', async () => {
    const screen = await renderTree({ readonly: true });
    const tree = /** @type {HTMLElement} */ (screen.getByRole('tree').element());
    const pictures = screen.getByRole('treeitem', { name: 'Pictures' });

    // A read-only widget stays in pointer interaction, so its content can still be selected and
    // copied; the click itself is what gets ignored
    expect(getComputedStyle(tree).pointerEvents).not.toBe('none');
    pictures.element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    await expect.element(pictures).toHaveAttribute('aria-selected', 'false');
  });
});
