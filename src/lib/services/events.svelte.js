/**
 * @import { ActionReturn } from 'svelte/action';
 */

/** @type {boolean | undefined} */
let _isMac;

/**
 * Check if the user agent is macOS.
 * @returns {boolean} Result.
 */
export const isMac = () => {
  _isMac ??=
    /** @type {any} */ (navigator).userAgentData?.platform === 'macOS' ||
    navigator.platform.startsWith('Mac');

  return _isMac;
};

const MODIFIER_KEYS = ['Ctrl', 'Meta', 'Alt', 'Shift'];
const CODE_RE = /^(?:Digit|Key)(.)$/;

/**
 * Whether the event matches the given keyboard shortcuts.
 * @param {KeyboardEvent} event `keydown` or `keypress` event.
 * @param {string} shortcuts Keyboard shortcuts like `A` or `Ctrl+S`.
 * @returns {boolean} Result.
 * @see https://w3c.github.io/aria/#aria-keyshortcuts
 */
export const matchShortcuts = (event, shortcuts) => {
  const { ctrlKey, metaKey, altKey, shiftKey, code } = event;

  // The `code` property can be `undefined` in some cases
  if (!code) {
    return false;
  }

  const key = code.replace(CODE_RE, '$1');

  return shortcuts.split(/\s+/).some((shortcut) => {
    const keys = shortcut.split('+');

    // Check if required modifier keys are pressed
    if (
      (keys.includes('Ctrl') && !ctrlKey) ||
      (keys.includes('Meta') && !metaKey) ||
      (keys.includes('Alt') && !altKey) ||
      (keys.includes('Shift') && !shiftKey)
    ) {
      return false;
    }

    // Check if unnecessary modifier keys are not pressed
    if (
      (!keys.includes('Ctrl') && ctrlKey) ||
      (!keys.includes('Meta') && metaKey) ||
      (!keys.includes('Alt') && altKey) ||
      (!keys.includes('Shift') && shiftKey)
    ) {
      return false;
    }

    return keys
      .filter((_key) => !MODIFIER_KEYS.includes(_key))
      .every((_key) => _key.toUpperCase() === key.toUpperCase());
  });
};

/**
 * Activate keyboard shortcuts.
 * @param {(HTMLInputElement | HTMLButtonElement)} element Element.
 * @param {string} [shortcuts] Keyboard shortcuts like `A` or `Accel+S` to focus and click the text
 * field or button. Multiple shortcuts can be defined space-separated. The `Accel` modifier will be
 * replaced with `Ctrl` on Windows/Linux and `Command` on macOS.
 * @returns {ActionReturn} Actions.
 */
export const activateKeyShortcuts = (element, shortcuts = '') => {
  /** @type {string | undefined} */
  let platformKeyShortcuts;
  /**
   * Pre-parsed shortcuts for fast per-event matching without string allocations.
   * @type {{ ctrl: boolean, meta: boolean, alt: boolean, shift: boolean, nonModifierKeys: string[]
   * }[] | undefined}
   */
  let parsedShortcuts;

  /**
   * Handle the event.
   * @param {KeyboardEvent} event `keydown` event.
   */
  const handler = (event) => {
    const { disabled, offsetParent } = element;

    // Check shortcut match and visibility first — no layout reflow until needed
    if (
      !offsetParent ||
      !parsedShortcuts?.some(({ ctrl, meta, alt, shift, nonModifierKeys }) => {
        const { ctrlKey, metaKey, altKey, shiftKey, code } = event;

        if (!code) {
          return false;
        }

        const key = code.replace(CODE_RE, '$1').toUpperCase();

        return (
          ctrl === ctrlKey &&
          meta === metaKey &&
          alt === altKey &&
          shift === shiftKey &&
          nonModifierKeys.every((k) => k === key)
        );
      })
    ) {
      return;
    }

    const { top, left } = element.getBoundingClientRect();

    if (disabled) {
      // Make sure `elementsFromPoint()` works as expected
      element.style.setProperty('pointer-events', 'auto');
    }

    // Check if the element is clickable (not behind a modal dialog)
    if (document.elementsFromPoint(left + 4, top + 4).includes(element)) {
      event.preventDefault();

      // Trigger click only when the element is enabled
      if (!disabled) {
        element.focus();
        element.click();
      }
    }

    if (disabled) {
      element.style.removeProperty('pointer-events');
    }
  };

  /**
   * Remove the event listener.
   */
  const removeListener = () => {
    globalThis.removeEventListener('keydown', handler, { capture: true });
    element.removeAttribute('aria-keyshortcuts');
  };

  /**
   * Add the event listener.
   */
  const addListener = () => {
    platformKeyShortcuts = shortcuts
      ? shortcuts.replace(/\bAccel\b/g, isMac() ? 'Meta' : 'Ctrl')
      : undefined;

    if (platformKeyShortcuts) {
      parsedShortcuts = platformKeyShortcuts.split(/\s+/).map((shortcut) => {
        const parts = shortcut.split('+');

        return {
          ctrl: parts.includes('Ctrl'),
          meta: parts.includes('Meta'),
          alt: parts.includes('Alt'),
          shift: parts.includes('Shift'),
          nonModifierKeys: parts
            .filter((k) => !MODIFIER_KEYS.includes(k))
            .map((k) => k.toUpperCase()),
        };
      });

      globalThis.addEventListener('keydown', handler, { capture: true });
      element.setAttribute('aria-keyshortcuts', platformKeyShortcuts);
    } else {
      parsedShortcuts = undefined;
    }
  };

  addListener();

  return {
    // eslint-disable-next-line jsdoc/require-jsdoc, no-shadow, no-unused-vars
    update(shortcuts) {
      removeListener();
      addListener();
    },

    // eslint-disable-next-line jsdoc/require-jsdoc
    destroy() {
      removeListener();
    },
  };
};
