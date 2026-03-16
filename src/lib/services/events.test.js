import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateKeyShortcuts, isMac, matchShortcuts } from './events.svelte.js';

/**
 * Helper to create a minimal KeyboardEvent-like object.
 * @param {Partial<KeyboardEvent>} overrides Event property overrides.
 * @returns {KeyboardEvent} A fake keyboard event.
 */
const makeEvent = (overrides = {}) =>
  /** @type {KeyboardEvent} */ ({
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    code: 'KeyA',
    ...overrides,
  });

describe('matchShortcuts', () => {
  it('should match a plain key shortcut', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyS' }), 'S')).toBe(true);
  });

  it('should not match when the key differs', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyA' }), 'S')).toBe(false);
  });

  it('should match Ctrl+S', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyS', ctrlKey: true }), 'Ctrl+S')).toBe(true);
  });

  it('should not match Ctrl+S when Ctrl is not pressed', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyS' }), 'Ctrl+S')).toBe(false);
  });

  it('should not match Ctrl+S when an extra modifier is pressed', () => {
    expect(
      matchShortcuts(makeEvent({ code: 'KeyS', ctrlKey: true, shiftKey: true }), 'Ctrl+S'),
    ).toBe(false);
  });

  it('should match Shift+A', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyA', shiftKey: true }), 'Shift+A')).toBe(true);
  });

  it('should match Alt+F4', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyF', altKey: true }), 'Alt+F')).toBe(true);
  });

  it('should match any of multiple space-separated shortcuts', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyZ', ctrlKey: true }), 'Ctrl+Z Ctrl+Y')).toBe(true);
    expect(matchShortcuts(makeEvent({ code: 'KeyY', ctrlKey: true }), 'Ctrl+Z Ctrl+Y')).toBe(true);
  });

  it('should return false when code is empty', () => {
    expect(matchShortcuts(makeEvent({ code: '' }), 'S')).toBe(false);
  });

  it('should match digit keys using Digit prefix', () => {
    expect(matchShortcuts(makeEvent({ code: 'Digit1' }), '1')).toBe(true);
  });

  it('should be case-insensitive for the key', () => {
    expect(matchShortcuts(makeEvent({ code: 'KeyS' }), 's')).toBe(true);
  });
});

describe('isMac', () => {
  it('should return a boolean', () => {
    expect(typeof isMac()).toBe('boolean');
  });
});

describe('activateKeyShortcuts', () => {
  /** @type {HTMLButtonElement} */
  let button;

  beforeEach(() => {
    button = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    document.body.appendChild(button);

    // happy-dom doesn't expose document.elementsFromPoint as a configurable property;
    // define a stub so vi.spyOn can wrap it in handler tests.
    if (!document.elementsFromPoint) {
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        writable: true,
        // eslint-disable-next-line jsdoc/require-jsdoc
        value: () => /** @type {Element[]} */ ([]),
      });
    }
  });

  afterEach(() => {
    button.remove();
    vi.restoreAllMocks();
  });

  it('should set aria-keyshortcuts when shortcuts are provided', () => {
    const action = activateKeyShortcuts(button, 'Ctrl+S');

    expect(button.getAttribute('aria-keyshortcuts')).toBe('Ctrl+S');
    action.destroy?.();
  });

  it('should not set aria-keyshortcuts when no shortcuts are provided', () => {
    const action = activateKeyShortcuts(button);

    expect(button.getAttribute('aria-keyshortcuts')).toBeNull();
    action.destroy?.();
  });

  it('should remove aria-keyshortcuts after destroy', () => {
    const action = activateKeyShortcuts(button, 'Ctrl+S');

    action.destroy?.();
    expect(button.getAttribute('aria-keyshortcuts')).toBeNull();
  });

  it('should replace Accel with Meta or Ctrl depending on platform', () => {
    const action = activateKeyShortcuts(button, 'Accel+S');
    const attr = button.getAttribute('aria-keyshortcuts');

    expect(attr === 'Meta+S' || attr === 'Ctrl+S').toBe(true);
    action.destroy?.();
  });

  it('should re-register the original shortcuts when update() is called', () => {
    // update() re-applies the same original shortcuts (param is intentionally ignored)
    const action = activateKeyShortcuts(button, 'Ctrl+S');

    /** @type {any} */ (action).update('Ctrl+Z');
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Ctrl+S');
    action.destroy?.();
  });

  it('should keep no aria-keyshortcuts when update() is called on a no-shortcut action', () => {
    const action = activateKeyShortcuts(button);

    /** @type {any} */ (action).update('Ctrl+Z'); // original shortcuts was '' so still none
    expect(button.getAttribute('aria-keyshortcuts')).toBeNull();
    action.destroy?.();
  });

  it('should trigger click on element when matching shortcut key is pressed', () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    Object.defineProperty(button, 'offsetParent', { configurable: true, get: () => document.body });
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue(/** @type {any} */ ([button]));

    const clickSpy = vi.fn();

    button.addEventListener('click', clickSpy);
    activateKeyShortcuts(button, 'Ctrl+S');
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyS', ctrlKey: true, bubbles: true }),
    );
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('should not trigger click when a non-matching key is pressed', () => {
    // Handler returns early before reaching elementsFromPoint when shortcut doesn't match
    const clickSpy = vi.fn();

    button.addEventListener('click', clickSpy);
    activateKeyShortcuts(button, 'Ctrl+S');
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true, bubbles: true }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should not trigger click when element is not in elementsFromPoint result', () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    Object.defineProperty(button, 'offsetParent', { configurable: true, get: () => document.body });
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue(/** @type {any} */ ([]));

    const clickSpy = vi.fn();

    button.addEventListener('click', clickSpy);
    activateKeyShortcuts(button, 'Ctrl+S');
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyS', ctrlKey: true, bubbles: true }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should not trigger click when the event code is empty (covers inner return false branch)', () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    Object.defineProperty(button, 'offsetParent', { configurable: true, get: () => document.body });
    activateKeyShortcuts(button, 'Ctrl+S');

    const clickSpy = vi.fn();

    button.addEventListener('click', clickSpy);
    // Dispatch with empty code — the parsedShortcuts.some() callback returns false (line 101)
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', { code: '', ctrlKey: true, bubbles: true }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should manipulate pointer-events for disabled button but not trigger click', () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    Object.defineProperty(button, 'offsetParent', { configurable: true, get: () => document.body });
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue(/** @type {any} */ ([button]));
    button.disabled = true;

    const clickSpy = vi.fn();
    const setPropertySpy = vi.spyOn(button.style, 'setProperty');
    const removePropertySpy = vi.spyOn(button.style, 'removeProperty');

    button.addEventListener('click', clickSpy);
    activateKeyShortcuts(button, 'Ctrl+S');
    globalThis.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyS', ctrlKey: true, bubbles: true }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
    expect(setPropertySpy).toHaveBeenCalledWith('pointer-events', 'auto');
    expect(removePropertySpy).toHaveBeenCalledWith('pointer-events');
  });
});
