import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Drawer from './drawer.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the `<dialog>` element.
 * @returns {HTMLDialogElement | null} Element.
 */
const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Wait until the drawer is open.
 */
const waitForOpen = async () => {
  await vi.waitFor(() => {
    expect(getDialog()?.open).toBe(true);
  });
};

describe('Drawer', () => {
  it('renders a right-hand drawer with an outside close button by default', async () => {
    await render(Drawer, { open: true, title: 'Filters', children: text('Body') });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());
    const content = /** @type {HTMLElement} */ (dialog.querySelector('.content'));

    expect(dialog.classList.contains('drawer')).toBe(true);
    expect(dialog.classList.contains('backdrop')).toBe(true);
    expect(content.classList.contains('right')).toBe(true);
    expect(content.classList.contains('vertical')).toBe(true);
    expect(content.classList.contains('small')).toBe(true);
    expect(content.querySelector('.extra-control button.close')).not.toBeNull();
    expect(content.querySelector('.header button.close')).toBeNull();
    expect(content.querySelector('.title')?.textContent?.trim()).toBe('Filters');
    expect(content.querySelector('.main')?.textContent).toContain('Body');
    expect(content.querySelector('.footer')).toBeNull();
    expect(content.querySelector('button.close')?.getAttribute('aria-controls')).toBe(dialog.id);
    // The built-in title labels the dialog
    expect(dialog.getAttribute('aria-labelledby')).toBe(content.querySelector('.title')?.id);
    expect(dialog.hasAttribute('aria-label')).toBe(false);
  });

  it('names the dialog by title text with a custom header', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      header: html('<h2 class="custom-header">Custom</h2>'),
    });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('aria-label')).toBe('Filters');
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('lets a custom header name the dialog by element ID', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      ariaLabelledby: 'custom-title',
      header: html('<h2 id="custom-title">Custom</h2>'),
    });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('aria-labelledby')).toBe('custom-title');
    expect(dialog.hasAttribute('aria-label')).toBe(false);
  });

  it('supports other positions, sizes and an inside close button', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      position: 'bottom',
      size: 'full',
      class: 'custom',
      showClose: 'inside',
      closeIcon: html('<i class="close-icon">x</i>'),
      footer: html('<button class="footer-button">Apply</button>'),
    });

    await waitForOpen();

    const content = /** @type {HTMLElement} */ (getDialog()?.querySelector('.content'));

    expect(content.classList.contains('bottom')).toBe(true);
    expect(content.classList.contains('horizontal')).toBe(true);
    expect(content.classList.contains('full')).toBe(true);
    expect(content.classList.contains('custom')).toBe(true);
    expect(content.querySelector('.extra-control button')).toBeNull();
    expect(content.querySelector('.header button.close .close-icon')).not.toBeNull();
    expect(content.querySelector('.footer .footer-button')).not.toBeNull();
  });

  it('omits the header without a title or close button', async () => {
    await render(Drawer, { open: true, showClose: false });
    await waitForOpen();

    const content = /** @type {HTMLElement} */ (getDialog()?.querySelector('.content'));

    expect(content.querySelector('.header')).toBeNull();
    expect(content.querySelector('button.close')).toBeNull();
  });

  it('renders the custom header and extra header content', async () => {
    const custom = await render(Drawer, {
      open: true,
      title: 'Filters',
      header: html('<h2 class="custom-header">Custom</h2>'),
    });

    await waitForOpen();
    expect(getDialog()?.querySelector('.custom-header')).not.toBeNull();
    expect(getDialog()?.querySelector('.title')).toBeNull();
    await custom.unmount();

    await render(Drawer, {
      open: true,
      title: 'Filters',
      headerExtra: html('<span class="header-extra">H</span>'),
    });

    await waitForOpen();
    expect(getDialog()?.querySelector('.header .header-extra')).not.toBeNull();
  });

  it('closes with the inside close button', async () => {
    /** @type {ComponentProps<typeof Drawer>} */
    const props = $state({ open: true, title: 'Filters', showClose: 'inside' });

    await render(Drawer, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('.header button.close')
    ).click();
    expect(props.open).toBe(false);
  });

  it('closes with the close button', async () => {
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Drawer>} */
    const props = $state({ open: true, title: 'Filters', onClose });

    await render(Drawer, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('button.close')
    ).click();
    expect(props.open).toBe(false);
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
    expect(onClose.mock.calls[0][0].detail.returnValue).toBe('close');
  });
});
