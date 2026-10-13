import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForMenuToClose } from './menu.js';

/**
 * Create a menu item within an open dialog.
 * @returns {{ dialog: HTMLDialogElement, item: HTMLElement }} The dialog and the item.
 */
const createOpenMenu = () => {
  const dialog = document.createElement('dialog');
  const item = document.createElement('button');

  dialog.append(item);
  dialog.setAttribute('open', '');
  document.body.append(dialog);

  return { dialog, item };
};

describe('waitForMenuToClose()', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('resolves on the next task for an item outside a dialog', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] });

    let resolved = false;

    waitForMenuToClose(document.createElement('button')).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(true);
  });

  it('waits for the dialog to close', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] });

    const { dialog, item } = createOpenMenu();
    let resolved = false;

    waitForMenuToClose(item).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(false);

    dialog.removeAttribute('open');
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(true);
  });

  it('gives up after a while if the dialog stays open', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] });

    const { item } = createOpenMenu();
    let resolved = false;

    waitForMenuToClose(item).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(2000);
    expect(resolved).toBe(true);
  });
});
