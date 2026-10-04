/**
 * Helpers for testing the components rendered in a modal `<dialog>`, such as `<Dialog>` and
 * `<Drawer>`.
 */

import { expect, vi } from 'vitest';

/**
 * Get the `<dialog>` element a modal has rendered into the document.
 * @returns {HTMLDialogElement | null} Element.
 */
export const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Wait until the modal `<dialog>` is open.
 */
export const waitForOpen = async () => {
  await vi.waitFor(() => {
    expect(getDialog()?.open).toBe(true);
  });
};
