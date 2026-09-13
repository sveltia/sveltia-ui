import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import AlertDialog from './alert-dialog.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders an alert dialog with only the OK button', async () => {
  const onOk = vi.fn();
  /** @type {ComponentProps<typeof AlertDialog>} */
  const props = $state({ open: true, title: 'Notice', children: text('Saved'), onOk });

  await render(AlertDialog, props);
  await vi.waitFor(() => {
    expect(document.querySelector('dialog')?.open).toBe(true);
  });

  const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('dialog'));

  expect(dialog.getAttribute('role')).toBe('alertdialog');
  expect(dialog.querySelector('.title')?.textContent?.trim()).toBe('Notice');
  expect(dialog.querySelector('button.secondary')).toBeNull();
  /** @type {HTMLButtonElement} */ (dialog.querySelector('button.primary')).click();
  expect(props.open).toBe(false);
  await vi.waitFor(() => {
    expect(onOk).toHaveBeenCalledOnce();
  });
});
