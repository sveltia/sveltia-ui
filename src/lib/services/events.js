/**
 * Check if the user agent is macOS.
 * @returns {boolean} Result.
 */
export const isMac = () =>
  /** @type {any} */ (navigator).userAgentData?.platform === 'macOS' ||
  navigator.platform.startsWith('Mac');

/**
 * Whether the event matches the given keyboard shortcuts.
 * @param {KeyboardEvent} event - `keydown` or `keypress` event.
 * @param {string} shortcuts - Keyboard shortcuts like `A` or `Ctrl+S`.
 * @returns {boolean} Result.
 * @see https://w3c.github.io/aria/#aria-keyshortcuts
 */
export const matchShortcuts = (event, shortcuts) => {
  const { ctrlKey, metaKey, altKey, shiftKey, key } = event;

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
      .filter((_key) => !['Ctrl', 'Meta', 'Alt', 'Shift'].includes(_key))
      .every((_key) => _key.toUpperCase() === key.toUpperCase());
  });
};

/**
 * Activate keyboard shortcuts.
 * @param {(HTMLInputElement | HTMLButtonElement)} element - Element.
 * @param {string} [shortcuts] - Keyboard shortcuts like `A` or `Accel+S` to focus and click the
 * text field or button. Multiple shortcuts can be defined space-separated. The `Accel` modifier
 * will be replaced with `Ctrl` on Windows/Linux and `Command` on macOS.
 * @returns {import('svelte/action').ActionReturn} Actions.
 */
export const activateKeyShortcuts = (element, shortcuts = '') => {
  /** @type {string | undefined} */
  let platformKeyShortcuts;

  /**
   * Handle the event.
   * @param {KeyboardEvent} event - `keydown` event.
   */
  const handler = (event) => {
    if (
      !!element.offsetParent &&
      matchShortcuts(event, /** @type {string} */ (platformKeyShortcuts))
    ) {
      event.preventDefault();

      if (!element.disabled) {
        element.focus();
        element.click();
      }
    }
  };

  /**
   * Remove the event listener.
   */
  const removeListener = () => {
    window.removeEventListener('keydown', handler);
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
      window.addEventListener('keydown', handler);
      element.setAttribute('aria-keyshortcuts', platformKeyShortcuts);
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
