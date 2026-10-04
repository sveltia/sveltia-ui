import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { getDialog, waitForOpen } from '../../test-utils/dialog.js';
import { text } from '../../test-utils/snippets.js';
import ConfirmationDialog from './confirmation-dialog.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders an alert dialog with the OK and Cancel buttons', async () => {
  const onCancel = vi.fn();
  /** @type {ComponentProps<typeof ConfirmationDialog>} */
  const props = $state({ open: true, title: 'Delete?', children: text('Really?'), onCancel });

  await render(ConfirmationDialog, props);
  await waitForOpen();

  const dialog = /** @type {HTMLDialogElement} */ (getDialog());

  expect(dialog.getAttribute('role')).toBe('alertdialog');
  expect(dialog.querySelector('button.primary')).not.toBeNull();
  /** @type {HTMLButtonElement} */ (dialog.querySelector('button.secondary')).click();
  expect(props.open).toBe(false);
  await vi.waitFor(() => {
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
