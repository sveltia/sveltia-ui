import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { html, text } from '../../test-utils/snippets.js';
import Dialog from './dialog.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the `<dialog>` element.
 * @returns {HTMLDialogElement | null} Element.
 */
const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Wait until the dialog is open.
 */
const waitForOpen = async () => {
  await vi.waitFor(() => {
    expect(getDialog()?.open).toBe(true);
  });
};

describe('Dialog', () => {
  it('renders the title, body and default buttons', async () => {
    await render(Dialog, { open: true, title: 'Confirm', children: text('Are you sure?') });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());
    const title = /** @type {HTMLElement} */ (dialog.querySelector('.title'));
    const body = /** @type {HTMLElement} */ (dialog.querySelector('.body'));

    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.classList.contains('dialog')).toBe(true);
    expect(dialog.classList.contains('backdrop')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Confirm');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(dialog.getAttribute('aria-describedby')).toBe(body.id);
    expect(title.textContent?.trim()).toBe('Confirm');
    expect(body.textContent).toContain('Are you sure?');
    expect(dialog.querySelector('.content')?.classList.contains('medium')).toBe(true);
    expect(dialog.querySelector('button.primary')?.textContent?.trim()).toBe('OK');
    expect(dialog.querySelector('button.secondary')?.textContent?.trim()).toBe('Cancel');
    expect(dialog.querySelector('.header button')).toBeNull();
  });

  it('applies the role, size, class and custom button labels', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      role: 'alertdialog',
      size: 'large',
      class: 'custom',
      okLabel: 'Yes',
      cancelLabel: 'No',
      okDisabled: true,
      cancelDisabled: true,
      showClose: true,
    });

    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());
    const ok = /** @type {HTMLButtonElement} */ (dialog.querySelector('button.primary'));
    const cancel = /** @type {HTMLButtonElement} */ (dialog.querySelector('button.secondary'));

    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.querySelector('.content')?.classList.contains('large')).toBe(true);
    expect(dialog.querySelector('.content')?.classList.contains('custom')).toBe(true);
    expect(ok.textContent?.trim()).toBe('Yes');
    expect(ok.disabled).toBe(true);
    expect(cancel.textContent?.trim()).toBe('No');
    expect(cancel.disabled).toBe(true);
    expect(dialog.querySelector('.header button')?.getAttribute('aria-label')).toBe('Close');
  });

  it('closes with the OK button', async () => {
    const onOk = vi.fn();
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Dialog>} */
    const props = $state({ open: true, title: 'T', onOk, onClose });

    await render(Dialog, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('button.primary')
    ).click();
    expect(props.open).toBe(false);
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
    expect(onOk).toHaveBeenCalledOnce();
    expect(onClose.mock.calls[0][0].detail.returnValue).toBe('ok');
  });

  it('closes with the Cancel and Close buttons', async () => {
    const onCancel = vi.fn();
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Dialog>} */
    const props = $state({ open: true, title: 'T', showClose: true, onCancel, onClose });

    await render(Dialog, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('button.secondary')
    ).click();
    await vi.waitFor(() => {
      expect(onCancel).toHaveBeenCalledOnce();
    });
    expect(onClose.mock.calls[0][0].detail.returnValue).toBe('cancel');

    props.open = true;
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('.header button')
    ).click();
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(2);
    });
    expect(onClose.mock.calls[1][0].detail.returnValue).toBe('close');
  });

  it('hides the buttons on demand', async () => {
    await render(Dialog, { open: true, title: 'T', showOk: false, showCancel: false });
    await waitForOpen();
    expect(getDialog()?.querySelector('.footer')).toBeNull();
  });

  it('renders the custom header and footer snippets', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      header: html('<h2 class="custom-header">Custom</h2>'),
      footer: html('<p class="custom-footer">Footer</p>'),
      extraContent: html('<p class="extra">Extra</p>'),
    });

    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.querySelector('.custom-header')).not.toBeNull();
    expect(dialog.querySelector('.title')).toBeNull();
    expect(dialog.querySelector('.custom-footer')).not.toBeNull();
    expect(dialog.querySelector('button.primary')).toBeNull();
    expect(dialog.querySelector('.extra')).not.toBeNull();
    // With a custom header, the title is passed as the labelling element ID
    expect(dialog.getAttribute('aria-labelledby')).toBe('T');
    expect(dialog.hasAttribute('aria-label')).toBe(false);
  });

  it('renders the extra header and footer snippets alongside the defaults', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      headerExtra: html('<span class="header-extra">H</span>'),
      footerExtra: html('<span class="footer-extra">F</span>'),
      closeIcon: html('<i class="close-icon">x</i>'),
      showClose: true,
    });

    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.querySelector('.header .header-extra')).not.toBeNull();
    expect(dialog.querySelector('.footer .footer-extra')).not.toBeNull();
    expect(dialog.querySelector('.footer button.primary')).not.toBeNull();
    expect(dialog.querySelector('.header .close-icon')).not.toBeNull();
  });

  it('focuses the first input and selects its content', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      children: html('<div><input value="hello"><button>Other</button></div>'),
    });

    await waitForOpen();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getDialog()?.querySelector('input'));
    });

    const input = /** @type {HTMLInputElement} */ (document.activeElement);

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
  });

  it('focuses the primary button without an input', async () => {
    await render(Dialog, { open: true, title: 'T', children: text('Body') });
    await waitForOpen();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getDialog()?.querySelector('button.primary'));
    });
  });

  it('focuses the dialog itself when there is nothing to focus', async () => {
    await render(Dialog, { open: true, title: 'T', showOk: false, showCancel: false });
    await waitForOpen();
    // Give the dialog’s own focus management a chance to run as well
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(document.activeElement).toBe(getDialog());
  });

  it('leaves the focus on content that takes it by itself', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      showOk: false,
      showCancel: false,
      children: html('<div><button class="own">Mine</button></div>'),
      /**
       * Have the content take the focus on its own as soon as the dialog is interactive.
       */
      onOpen: () => {
        setTimeout(() => {
          /** @type {HTMLElement} */ (
            /** @type {HTMLDialogElement} */ (getDialog()).querySelector('.own')
          ).focus();
        }, 10);
      },
    });

    await waitForOpen();
    await vi.waitFor(() => {
      expect(getDialog()?.classList.contains('active')).toBe(true);
    });
    expect(document.activeElement).toBe(getDialog()?.querySelector('.own'));
  });

  it('omits the header and footer when there is nothing to show', async () => {
    await render(Dialog, { open: true, title: '', showOk: false, showCancel: false });
    await waitForOpen();
    expect(getDialog()?.querySelector('.header')).toBeNull();
    expect(getDialog()?.querySelector('.footer')).toBeNull();
  });

  it('focuses the dialog itself when asked not to focus an input', async () => {
    await render(Dialog, {
      open: true,
      title: 'T',
      focusInput: false,
      children: html('<div><input value="hello"></div>'),
    });

    await waitForOpen();
    // Give the dialog’s own focus management a chance to run as well
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(document.activeElement).toBe(getDialog());
  });

  it('shows the Cancel button alone', async () => {
    await render(Dialog, { open: true, title: 'T', showOk: false });
    await waitForOpen();
    expect(getDialog()?.querySelector('.footer button.primary')).toBeNull();
    expect(getDialog()?.querySelector('.footer button.secondary')).not.toBeNull();
  });

  it('triggers the OK button with its keyboard shortcut', async () => {
    const onOk = vi.fn();

    await render(Dialog, { open: true, title: 'T', okShortcuts: 'Accel+Enter', onOk });
    await waitForOpen();
    // The shortcut only applies once the button is actually clickable, i.e. once the opening
    // transition is complete
    await vi.waitFor(() => {
      expect(getDialog()?.classList.contains('active')).toBe(true);
    });

    const shortcuts = getDialog()
      ?.querySelector('button.primary')
      ?.getAttribute('aria-keyshortcuts');

    expect(shortcuts).toMatch(/^(Control|Meta)\+Enter$/);

    const modifier = shortcuts?.startsWith('Meta') ? 'Meta' : 'Control';

    await userEvent.keyboard(`{${modifier}>}{Enter}{/${modifier}}`);
    await vi.waitFor(() => {
      expect(onOk).toHaveBeenCalledOnce();
    });
  });
});
