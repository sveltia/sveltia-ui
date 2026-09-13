import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { whenActivated } from '../../test-utils/group.js';
import { html, text } from '../../test-utils/snippets.js';
import MenuButton from './menu-button.svelte';
import MenuFixture from './menu-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the menu rendered in the popup.
 * @returns {HTMLElement | null} Element.
 */
const getMenu = () => document.querySelector('dialog.popup [role="menu"]');

/**
 * Render the fixture and open the menu.
 * @param {ComponentProps<typeof MenuFixture>} [props] Props.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof MenuFixture>>>,
 * menu: HTMLElement }>} Rendered fixture and the menu element.
 */
const renderOpen = async (props = {}) => {
  const screen = await render(MenuFixture, props);
  const activated = whenActivated();

  await screen.getByRole('button', { name: 'Actions' }).click();
  await activated;
  await vi.waitFor(() => {
    expect(getMenu()?.checkVisibility()).toBe(true);
  });

  return { screen, menu: /** @type {HTMLElement} */ (getMenu()) };
};

describe('MenuButton', () => {
  it('renders a button with a dropdown arrow', async () => {
    const screen = await render(MenuButton, {
      label: 'Actions',
      class: 'custom',
      variant: 'ghost',
    });

    const button = screen.getByRole('button', { name: 'Actions' });

    await expect.element(button).toHaveClass('sui', 'menu-button', 'custom', 'ghost');
    await expect.element(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('arrow_drop_down');
  });

  it('shows the more icon when iconic, or a custom end icon', async () => {
    const iconic = await render(MenuButton, { iconic: true, 'aria-label': 'More' });

    expect(iconic.container.querySelector('.icon')?.textContent?.trim()).toBe('more_vert');

    const custom = await render(MenuButton, {
      endIcon: html('<i class="end">E</i>'),
      startIcon: html('<i class="start">S</i>'),
      children: text('Child'),
    });

    const button = /** @type {HTMLElement} */ (custom.container.querySelector('button'));

    expect(button.querySelector('.end')).not.toBeNull();
    expect(button.querySelector('.start')).not.toBeNull();
    expect(button.querySelector('.sui.icon')).toBeNull();
    expect(button.textContent).toContain('Child');
  });

  it('hides and disables the button, and focuses it on demand', async () => {
    const screen = await render(MenuButton, { label: 'Actions', hidden: true, disabled: true });
    const button = /** @type {HTMLButtonElement} */ (screen.container.querySelector('button'));

    expect(button.hidden).toBe(true);
    expect(button.disabled).toBe(true);

    const visible = await render(MenuButton, { label: 'Focus me' });

    visible.component.focus();
    expect(document.activeElement).toBe(visible.container.querySelector('button'));
  });

  it('opens the menu, focuses the first item and activates items', async () => {
    const onItemClick = vi.fn();
    const onMenuChange = vi.fn();
    /** @type {ComponentProps<typeof MenuFixture>} */
    const props = $state({ checked: false, onItemClick, onMenuChange });
    const { screen, menu } = await renderOpen(props);
    const button = screen.getByRole('button', { name: 'Actions' });

    await expect.element(button).toHaveAttribute('aria-expanded', 'true');

    const rename = screen.getByRole('menuitem', { name: 'Rename' }).element();

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(rename);
    });
    expect(/** @type {HTMLElement} */ (rename).tabIndex).toBe(0);
    rename.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onItemClick).toHaveBeenCalledOnce();

    // Toggle the checkbox item
    const pinned = /** @type {HTMLElement} */ (menu.querySelector('[role="menuitemcheckbox"]'));

    pinned.click();
    await vi.waitFor(() => {
      expect(props.checked).toBe(true);
    });
    expect(onMenuChange).toHaveBeenCalled();

    // Activating an item closes the menu
    await vi.waitFor(() => {
      expect(getMenu()).toBeNull();
    });
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('checks one radio item at a time', async () => {
    const { menu } = await renderOpen();

    const [ascending, descending] = /** @type {HTMLElement[]} */ ([
      ...menu.querySelectorAll('[role="menuitemradio"]'),
    ]);

    expect(ascending.getAttribute('aria-checked')).toBe('true');
    descending.click();
    await vi.waitFor(() => {
      expect(descending.getAttribute('aria-checked')).toBe('true');
    });
    expect(ascending.getAttribute('aria-checked')).toBe('false');
  });

  it('navigates the items with the keyboard and opens a submenu', async () => {
    const { screen } = await renderOpen();
    const rename = screen.getByRole('menuitem', { name: 'Rename' }).element();
    const share = screen.getByRole('menuitem', { name: /Share/ }).element();

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(rename);
    });
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(share);
    });

    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('true');
    });
    await vi.waitFor(() => {
      expect(document.activeElement?.textContent?.trim()).toBe('Copy Link');
    });

    // Escape leaves the submenu, then closes the menu
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('false');
    });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(share);
    });
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(getMenu()).toBeNull();
    });
  });

  it('opens a submenu when its item is hovered', async () => {
    const { screen } = await renderOpen();
    const share = screen.getByRole('menuitem', { name: /Share/ }).element();

    share.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('true');
    });
    await expect.element(screen.getByRole('menuitem', { name: 'Copy Link' })).toBeVisible();

    // Leaving the item without reaching the submenu closes it
    share.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('false');
    });

    share.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('true');
    });

    // Moving from the item onto the submenu keeps it open…
    const submenu = /** @type {HTMLElement} */ (
      screen.getByRole('menuitem', { name: 'Copy Link' }).element().closest('.content')
    );

    share.dispatchEvent(new MouseEvent('mouseleave'));
    submenu.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    expect(share.getAttribute('aria-expanded')).toBe('true');

    // …and leaving the submenu closes it
    submenu.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.waitFor(() => {
      expect(share.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
