/**
 * Helpers for testing the composite widgets driven by the `group` and `tree` services.
 */

/**
 * Start waiting for the composite widgets about to be rendered to become interactive. The services
 * activate a widget shortly after it’s mounted, once its members have had a chance to render, and
 * only then start listening for clicks and key presses. A test must therefore render the widget
 * after* calling this, and await the result before interacting with it.
 *
 * The `Initialized` event a service dispatches doesn’t bubble, so it’s caught in the capture phase,
 * where non-bubbling events can still be observed from an ancestor.
 * @param {number} [count] Number of widgets to wait for. Nested widgets, such as a `<Combobox>`
 * wrapping a `<Listbox>`, or a `<Menu>` next to a `<Toolbar>`, each count separately.
 * @returns {Promise<void>} Resolves once every widget has been activated.
 */
export const whenActivated = (count = 1) =>
  new Promise((resolve) => {
    let remaining = count;

    /**
     * Count down the activations.
     */
    const onInitialized = () => {
      remaining -= 1;

      if (remaining <= 0) {
        document.removeEventListener('Initialized', onInitialized, { capture: true });
        resolve();
      }
    };

    document.addEventListener('Initialized', onInitialized, { capture: true });
  });
