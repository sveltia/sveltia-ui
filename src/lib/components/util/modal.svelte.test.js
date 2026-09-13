import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { whenActivated } from '../../test-utils/group.js';
import { html } from '../../test-utils/snippets.js';
import Modal from './modal.svelte';
import NestedModalFixture from './nested-modal-fixture.test.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the `<dialog>` element a modal has rendered into the document.
 * @returns {HTMLDialogElement | null} Element.
 */
const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Wait until the given condition is met.
 * @param {() => boolean} condition Condition.
 */
const waitFor = async (condition) => {
  await vi.waitFor(() => {
    expect(condition()).toBe(true);
  });
};

describe('Modal', () => {
  it('mounts nothing while closed', async () => {
    await render(Modal, { children: html('<p>Body</p>') });

    expect(getDialog()).toBeNull();
  });

  it('shows the dialog in the top layer when opened, and fires the opening events', async () => {
    const onOpening = vi.fn();
    const onOpen = vi.fn();

    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({
      open: false,
      children: html('<p>Body</p>'),
      extraContent: html('<p>Extra</p>'),
      onOpening,
      onOpen,
    });

    const screen = await render(Modal, props);

    props.open = true;
    await waitFor(() => !!getDialog()?.open);

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.textContent).toContain('Extra');
    expect(dialog.textContent).toContain('Body');
    // The content is rendered outside the component’s own container
    expect(screen.container.contains(dialog)).toBe(false);
    expect(onOpening).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
    expect(dialog.matches(':modal')).toBe(true);
    await waitFor(() => dialog.classList.contains('open'));
    await waitFor(() => dialog.classList.contains('active'));
    expect(dialog.hasAttribute('inert')).toBe(false);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('passes the role, class and other attributes to the dialog', async () => {
    await render(Modal, {
      open: true,
      role: 'alertdialog',
      class: 'custom',
      showBackdrop: true,
      'aria-label': 'Attention',
    });

    await waitFor(() => !!getDialog());

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.classList.contains('custom')).toBe(true);
    expect(dialog.classList.contains('backdrop')).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Attention');
  });

  it('closes with a return value and fires the matching events', async () => {
    const onClosing = vi.fn();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, onClosing, onOk, onCancel, onClose });
    const screen = await render(Modal, props);

    await waitFor(() => getDialog()?.classList.contains('active') ?? false);
    screen.component.close('ok');
    expect(props.open).toBe(false);
    await waitFor(() => onClosing.mock.calls.length === 1);
    await waitFor(() => onClose.mock.calls.length === 1);
    expect(onOk).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose.mock.calls[0][0].detail.returnValue).toBe('ok');
    // The dialog is unmounted once the closing transition is complete
    await waitFor(() => getDialog() === null);
  });

  it('fires the cancel event when closed with the cancel value', async () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const screen = await render(Modal, { open: true, onOk, onCancel });

    await waitFor(() => !!getDialog()?.open);
    screen.component.close('cancel');
    await waitFor(() => onCancel.mock.calls.length === 1);
    expect(onOk).not.toHaveBeenCalled();
  });

  it('keeps the dialog mounted while closed when asked to', async () => {
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: false, keepContent: true, children: html('<p>Kept</p>') });

    await render(Modal, props);
    expect(getDialog()).not.toBeNull();
    expect(getDialog()?.open).toBe(false);
    expect(getDialog()?.hasAttribute('inert')).toBe(true);

    props.open = true;
    await waitFor(() => !!getDialog()?.open);
    props.open = false;
    await waitFor(() => !getDialog()?.open);
    expect(getDialog()).not.toBeNull();
  });

  it('dismisses with the Escape key unless disabled', async () => {
    const onCancel = vi.fn();
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, onCancel });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);
    // The browser fires `cancel` on the dialog when Escape is pressed
    getDialog()?.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(props.open).toBe(false);
    await waitFor(() => onCancel.mock.calls.length === 1);
  });

  it('ignores the Escape key when escape dismiss is disabled', async () => {
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, escapeDismiss: false });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);

    const event = new Event('cancel', { cancelable: true });

    getDialog()?.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(props.open).toBe(true);
  });

  it('dismisses when the backdrop is clicked only with light dismiss enabled', async () => {
    const onCancel = vi.fn();
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, lightDismiss: false, onCancel, children: html('<p>B</p>') });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    // A click on the `<dialog>` element itself lands on the backdrop
    dialog.click();
    expect(props.open).toBe(true);

    props.lightDismiss = true;
    dialog.click();
    expect(props.open).toBe(false);
    await waitFor(() => onCancel.mock.calls.length === 1);
  });

  it('does not dismiss when the content is clicked', async () => {
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, lightDismiss: true, children: html('<p>Inside</p>') });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);
    /** @type {HTMLElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('p')
    ).click();
    expect(props.open).toBe(true);
  });

  it('moves the focus back to the opener once closed', async () => {
    const opener = document.createElement('button');

    document.body.appendChild(opener);
    opener.focus();

    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: false, children: html('<button>Inner</button>') });

    await render(Modal, props);
    props.open = true;
    await waitFor(() => !!getDialog()?.open);
    expect(document.activeElement).not.toBe(opener);
    props.open = false;
    await waitFor(() => document.activeElement === opener);
  });

  it('has nothing to restore the focus to when a non-HTML element had it', async () => {
    document.body.innerHTML = '<svg tabindex="0" width="10" height="10"></svg>';

    const svg = /** @type {SVGElement} */ (document.querySelector('svg'));

    svg.focus();
    expect(document.activeElement).toBe(svg);

    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, children: html('<button>Inner</button>') });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);
    props.open = false;
    await waitFor(() => getDialog() === null);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(document.activeElement).toBe(document.body);
  });

  it('stays open when reopened during the closing transition', async () => {
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, onClose });

    await render(Modal, props);
    await waitFor(() => getDialog()?.classList.contains('active') ?? false);
    props.open = false;
    await waitFor(() => !getDialog()?.open);
    props.open = true;
    await waitFor(() => !!getDialog()?.open);
    await waitFor(() => getDialog()?.classList.contains('active') ?? false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves the focus alone when focus restoration is disabled', async () => {
    const opener = document.createElement('button');

    document.body.appendChild(opener);
    opener.focus();

    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, restoreFocus: false });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);
    props.open = false;
    await waitFor(() => getDialog() === null);
    expect(document.activeElement).not.toBe(opener);
  });

  it('exposes the dialog element and focuses it on demand', async () => {
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({
      open: true,
      dialog: undefined,
      children: html('<button>Inner</button>'),
    });

    const screen = await render(Modal, props);

    await waitFor(() => !!getDialog()?.open);
    expect(props.dialog).toBe(getDialog());
    /** @type {HTMLElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('button')
    ).focus();
    screen.component.focus();
    expect(document.activeElement).toBe(getDialog());
  });

  it('renders the dialog within the app shell when there is one', async () => {
    const shell = document.createElement('div');

    shell.className = 'sui app-shell';
    document.body.appendChild(shell);
    await render(Modal, { open: true });
    await waitFor(() => !!getDialog());
    expect(shell.contains(getDialog())).toBe(true);
  });

  it('keeps a menu mounted while a dialog opened from it is on screen', async () => {
    const activated = whenActivated();
    const screen = await render(NestedModalFixture);

    await screen.getByRole('button', { name: 'Actions' }).click();
    await activated;
    await screen.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = screen.getByRole('dialog', { name: 'Delete?' });

    await expect.element(dialog).toBeVisible();
    // The menu popup has closed, but its content is retained for the dialog’s sake
    await expect
      .element(screen.getByRole('button', { name: 'Actions' }))
      .toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('dialog.popup')).not.toBeNull();

    await screen.getByRole('button', { name: 'Cancel' }).click();
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.dialog')).toBeNull();
    });
    // Once the dialog is gone, so is the menu
    await vi.waitFor(() => {
      expect(document.querySelector('dialog.popup')).toBeNull();
    });
  });

  it('ignores a close request while closed', async () => {
    const onClose = vi.fn();
    const screen = await render(Modal, { onClose });

    screen.component.close('ok');
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('gives up on an open request that is withdrawn right away', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: false, onOpen, onClose });

    await render(Modal, props);
    // Withdrawn before the effect even runs: nothing happens at all
    props.open = true;
    props.open = false;
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(getDialog()).toBeNull();

    // Withdrawn while the dialog is being mounted: the opening is abandoned
    props.open = true;
    await Promise.resolve();
    props.open = false;
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    expect(getDialog()).toBeNull();
  });

  it('leaves the focus alone when the opener has gone away', async () => {
    const opener = document.createElement('button');

    document.body.appendChild(opener);
    opener.focus();

    /** @type {ComponentProps<typeof Modal>} */
    const props = $state({ open: true, children: html('<button>Inner</button>') });

    await render(Modal, props);
    await waitFor(() => !!getDialog()?.open);
    opener.remove();
    props.open = false;
    await waitFor(() => getDialog() === null);
    expect(document.activeElement).toBe(document.body);
  });

  it('removes the dialog when unmounted while open', async () => {
    const screen = await render(Modal, { open: true });

    await waitFor(() => !!getDialog()?.open);
    await screen.unmount();
    expect(getDialog()).toBeNull();
  });
});
