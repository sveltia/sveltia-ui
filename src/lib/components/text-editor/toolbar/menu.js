/**
 * Helpers for the menus on the text editor toolbar.
 */

/**
 * Maximum number of frames to wait for a menu to close.
 */
const MAX_CLOSE_FRAMES = 60;

/**
 * Wait for the menu the given item is in to close. A menu is a modal dialog, which makes the rest
 * of the page inert while it’s open, so the editor can’t take the focus yet. Once closed, the
 * dialog moves the focus back to the button that opened it on the next task, so wait for that as
 * well.
 * Call this before moving the focus back to the editor after an item is chosen.
 * @param {HTMLElement} item Menu item chosen.
 * @param {number} [frames] Number of frames waited so far.
 * @returns {Promise<void>} Nothing.
 */
export const waitForMenuToClose = async (item, frames = 0) => {
  if (item.closest('dialog')?.open && frames < MAX_CLOSE_FRAMES) {
    await new Promise((resolve) => {
      window.requestAnimationFrame(resolve);
    });

    return waitForMenuToClose(item, frames + 1);
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve);
  });
};
