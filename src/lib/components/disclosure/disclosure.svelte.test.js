import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Disclosure from './disclosure.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Disclosure', () => {
  it('renders a collapsed disclosure labelled by its header', async () => {
    const screen = await render(Disclosure, {
      label: 'Details',
      class: 'custom',
      children: text('Hidden content'),
    });

    const group = screen.getByRole('group', { name: 'Details' });
    const header = screen.getByRole('button', { name: 'Details' });
    const content = /** @type {HTMLElement} */ (group.element().querySelector('.content'));

    await expect.element(group).toHaveClass('sui', 'disclosure', 'custom');
    await expect.element(group).toHaveAttribute('aria-roledescription', 'disclosure');
    expect(group.element().getAttribute('aria-labelledby')).toBe(header.element().id);
    await expect.element(header).toHaveAttribute('aria-expanded', 'false');
    expect(header.element().getAttribute('aria-controls')).toBe(content.id);
    expect(content.hidden).toBe(true);
    expect(header.element().querySelector('.icon')?.textContent?.trim()).toBe('expand_more');
    expect(
      getComputedStyle(/** @type {HTMLElement} */ (header.element().querySelector('.icon')))
        .transform,
    ).not.toBe('none');
  });

  it('expands and collapses when the header is clicked', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof Disclosure>} */
    const props = $state({ label: 'Details', expanded: false, onChange });
    const screen = await render(Disclosure, props);
    const header = screen.getByRole('button', { name: 'Details' });
    const content = /** @type {HTMLElement} */ (screen.container.querySelector('.content'));

    await header.click();
    await expect.element(header).toHaveAttribute('aria-expanded', 'true');
    expect(content.hidden).toBe(false);
    expect(props.expanded).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({ expanded: true });
    await header.click();
    expect(props.expanded).toBe(false);
    expect(content.hidden).toBe(true);
  });

  it('follows the bound prop', async () => {
    /** @type {ComponentProps<typeof Disclosure>} */
    const props = $state({ label: 'Details', expanded: true });
    const screen = await render(Disclosure, props);
    const content = /** @type {HTMLElement} */ (screen.container.querySelector('.content'));

    expect(content.hidden).toBe(false);
    props.expanded = false;
    await vi.waitFor(() => {
      expect(content.hidden).toBe(true);
    });
  });

  it('makes the collapsed content unfocusable and hidden from assistive technology', async () => {
    /** @type {ComponentProps<typeof Disclosure>} */
    const props = $state({
      label: 'Details',
      expanded: false,
      children: html('<button type="button" class="inside">Inside</button>'),
    });

    const screen = await render(Disclosure, props);
    const content = /** @type {HTMLElement} */ (screen.container.querySelector('.content'));
    const inside = /** @type {HTMLButtonElement} */ (screen.container.querySelector('.inside'));

    expect(content.inert).toBe(true);
    inside.focus();
    expect(document.activeElement).not.toBe(inside);
    props.expanded = true;
    await vi.waitFor(() => {
      expect(content.inert).toBe(false);
    });
    inside.focus();
    expect(document.activeElement).toBe(inside);
  });

  it('doesn’t restyle the buttons in the content', async () => {
    const screen = await render(Disclosure, {
      label: 'Details',
      expanded: true,
      children: html(
        '<button type="button" class="inside" aria-expanded="false"><span class="icon">v</span></button>',
      ),
    });

    const header = /** @type {HTMLElement} */ (screen.container.querySelector('.header'));
    const inside = /** @type {HTMLElement} */ (screen.container.querySelector('.inside'));

    expect(getComputedStyle(header).display).toBe('flex');
    expect(getComputedStyle(inside).display).not.toBe('flex');
    expect(getComputedStyle(/** @type {HTMLElement} */ (inside.firstElementChild)).transform).toBe(
      'none',
    );
  });

  it('renders a custom chevron', async () => {
    const screen = await render(Disclosure, { chevronIcon: html('<i class="chevron">v</i>') });

    expect(screen.container.querySelector('.chevron')).not.toBeNull();
    expect(screen.container.querySelector('.sui.icon')).toBeNull();
  });

  it('hides and disables the disclosure', async () => {
    const screen = await render(Disclosure, { label: 'Details', hidden: true, disabled: true });
    const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="group"]'));

    expect(group.hidden).toBe(true);
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
    expect(/** @type {HTMLButtonElement} */ (group.querySelector('button')).disabled).toBe(true);
  });
});
