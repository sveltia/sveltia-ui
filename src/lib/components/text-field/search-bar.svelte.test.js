import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html } from '../../test-utils/snippets.js';
import SearchBar from './search-bar.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('SearchBar', () => {
  it('renders a search box with a magnifier icon', async () => {
    const screen = await render(SearchBar, { ariaLabel: 'Search', class: 'custom', flex: true });
    const input = screen.getByRole('searchbox', { name: 'Search' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.search-bar'));

    await expect.element(input).toHaveAttribute('inputmode', 'search');
    await expect.element(input).toHaveAttribute('dir', 'auto');
    expect(wrapper.getAttribute('role')).toBe('none');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(wrapper.querySelector('.icon')?.textContent?.trim()).toBe('search');
    // No clear button while empty
    expect(wrapper.querySelector('button')).toBeNull();
  });

  it('renders custom icons', async () => {
    const screen = await render(SearchBar, {
      value: 'x',
      searchIcon: html('<i class="magnifier">Q</i>'),
      closeIcon: html('<i class="x">X</i>'),
    });

    expect(screen.container.querySelector('.magnifier')).not.toBeNull();
    expect(screen.container.querySelector('button .x')).not.toBeNull();
    expect(screen.container.querySelector('.sui.icon')).toBeNull();
  });

  it('clears the value with the clear button and refocuses the field', async () => {
    const onClear = vi.fn();
    /** @type {ComponentProps<typeof SearchBar>} */
    const props = $state({ value: 'query', onClear });
    const screen = await render(SearchBar, props);
    const input = screen.getByRole('searchbox');
    const clear = screen.getByRole('button', { name: 'Clear' });

    expect(clear.element().getAttribute('aria-controls')).toBe(input.element().id);
    await clear.click();
    expect(props.value).toBe('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input.element());
    await vi.waitFor(() => {
      expect(screen.container.querySelector('button')).toBeNull();
    });
    await input.fill('again');
    expect(props.value).toBe('again');
    await expect.element(screen.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  it('focuses the field on demand', async () => {
    const screen = await render(SearchBar);

    screen.component.focus();
    expect(document.activeElement).toBe(screen.container.querySelector('input'));
  });

  it('reflects the state props', async () => {
    const screen = await render(SearchBar, {
      hidden: true,
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.search-bar'));
    const input = /** @type {HTMLInputElement} */ (wrapper.querySelector('input'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.hasAttribute('role')).toBe(false);
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.classList.contains('readonly')).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
