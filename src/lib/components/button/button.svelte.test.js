import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Button from './button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Button', () => {
  it('renders a button with the label and default attributes', async () => {
    const screen = await render(Button, { label: 'Save' });
    const button = screen.getByRole('button', { name: 'Save' });

    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveAttribute('type', 'button');
    await expect.element(button).toHaveClass('sui', 'button', 'medium');
    await expect.element(button).toHaveAttribute('aria-hidden', 'false');
    await expect.element(button).toHaveAttribute('aria-disabled', 'false');
    // `aria-readonly` isn’t supported on the `button` role, so it’s left out unless it applies
    expect(button.element().hasAttribute('aria-readonly')).toBe(false);
    await expect.element(button).toHaveAttribute('data-label', 'Save');
    expect(button.element().hasAttribute('aria-pressed')).toBe(false);
    expect(button.element().querySelector('.label .sui.truncated-text')).not.toBeNull();
  });

  it('applies the variant, size and modifier classes', async () => {
    const screen = await render(Button, {
      label: 'Go',
      variant: 'primary',
      size: 'large',
      iconic: true,
      pill: true,
      flex: true,
      class: 'custom',
    });

    await expect
      .element(screen.getByRole('button'))
      .toHaveClass('primary', 'large', 'iconic', 'pill', 'flex', 'custom');
  });

  it('updates the classes when the props change', async () => {
    /** @type {ComponentProps<typeof Button>} */
    const props = $state({ label: 'Go', variant: 'primary' });
    const screen = await render(Button, props);

    props.variant = 'ghost';
    await expect.element(screen.getByRole('button')).toHaveClass('ghost');
    await expect.element(screen.getByRole('button')).not.toHaveClass('primary');
  });

  it('reflects the state props as attributes', async () => {
    const screen = await render(Button, {
      label: 'Go',
      disabled: true,
      readonly: true,
      pressed: 'mixed',
      hidden: true,
      type: 'submit',
      role: 'tab',
    });

    const button = /** @type {HTMLButtonElement} */ (screen.container.querySelector('button'));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-readonly')).toBe('true');
    expect(button.getAttribute('aria-pressed')).toBe('mixed');
    expect(button.hidden).toBe(true);
    expect(button.getAttribute('aria-hidden')).toBe('true');
    expect(button.type).toBe('submit');
    expect(button.getAttribute('role')).toBe('tab');
  });

  it('exposes the name and value with the detected type', async () => {
    const screen = await render(Button, { name: 'count', value: 42 });
    const button = screen.getByRole('button');

    await expect.element(button).toHaveAttribute('name', 'count');
    await expect.element(button).toHaveAttribute('value', '42');
    await expect.element(button).toHaveAttribute('data-name', 'count');
    await expect.element(button).toHaveAttribute('data-value', '42');
    await expect.element(button).toHaveAttribute('data-type', 'number');
  });

  it('accepts an explicit value type', async () => {
    const screen = await render(Button, { value: '1', valueType: 'boolean' });

    await expect.element(screen.getByRole('button')).toHaveAttribute('data-type', 'boolean');
  });

  it('renders the icon slots around the label and children', async () => {
    const screen = await render(Button, {
      label: 'Label',
      startIcon: html('<i class="start">S</i>'),
      endIcon: html('<i class="end">E</i>'),
      children: text('Child'),
    });

    const button = screen.getByRole('button');

    expect(button.element().textContent?.replace(/\s+/g, ' ').trim()).toBe('S Label Child E');
  });

  it('applies the label direction and line count', async () => {
    const screen = await render(Button, { label: 'Label', labelDir: 'auto', lines: 2 });
    const label = /** @type {HTMLElement} */ (screen.container.querySelector('.label'));

    expect(label.getAttribute('dir')).toBe('auto');
    expect(label.querySelector('.truncated-text')?.getAttribute('style')).toContain(
      'line-clamp: 2',
    );
  });

  it('wraps the children in the label for the link variant', async () => {
    const screen = await render(Button, { variant: 'link', children: text('Read more') });
    const label = screen.container.querySelector('.label');

    expect(label?.textContent?.trim()).toBe('Read more');
    expect(label?.querySelector('.truncated-text')).toBeNull();
  });

  it('prefers the label over the children for the link variant', async () => {
    const screen = await render(Button, {
      variant: 'link',
      label: 'Label',
      children: text('Child'),
    });

    expect(screen.container.querySelector('button')?.textContent?.trim()).toBe('Label');
  });

  it('passes other attributes through and handles clicks', async () => {
    const onclick = vi.fn();
    const screen = await render(Button, { label: 'Go', 'data-id': 'x', title: 'Tip', onclick });
    const button = screen.getByRole('button');

    await expect.element(button).toHaveAttribute('data-id', 'x');
    await expect.element(button).toHaveAttribute('title', 'Tip');
    await button.click();
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('exposes the element through the bindable prop', async () => {
    /** @type {ComponentProps<typeof Button>} */
    const props = $state({ element: undefined, label: 'Go' });
    const screen = await render(Button, props);

    expect(props.element).toBe(screen.container.querySelector('button'));
  });

  it('activates the keyboard shortcuts only when given', async () => {
    const onclick = vi.fn();
    const screen = await render(Button, { label: 'Go', keyShortcuts: 'Accel+S', onclick });
    const button = screen.getByRole('button');

    expect(button.element().getAttribute('aria-keyshortcuts')).toMatch(/^(Ctrl|Meta)\+S$/);

    const plain = await render(Button, { label: 'Plain' });

    expect(plain.container.querySelector('button')?.hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('opens the popup content when clicked', async () => {
    const screen = await render(Button, {
      label: 'Menu',
      'aria-haspopup': 'menu',
      popup: html('<div role="menu" tabindex="-1"><div role="menuitem" tabindex="0">A</div></div>'),
    });

    const button = screen.getByRole('button', { name: 'Menu' });

    expect(document.querySelector('dialog.popup')).toBeNull();
    await button.click();
    await expect.element(button).toHaveAttribute('aria-expanded', 'true');
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.popup .content')?.checkVisibility()).toBe(true);
    });
    expect(document.querySelector('dialog.popup .content')?.classList.contains('menu')).toBe(true);
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    });
  });
});
