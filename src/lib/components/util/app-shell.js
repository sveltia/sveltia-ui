/**
 * Helpers behind `<AppShell>`, kept apart from the component so they can be tested on their own.
 */

/**
 * Whether the browser’s context menu should be allowed on the given element. The shell suppresses
 * it to feel more like a native app, except where it’s actually useful: on text fields and rich
 * text editors, where the menu carries the cut/copy/paste and spell-checking commands.
 * @param {EventTarget | null} target The element that was right-clicked.
 * @returns {boolean} `true` to leave the browser’s context menu alone.
 */
export const shouldAllowContextMenu = (target) => {
  // Allow context menu in developer mode
  if (document.documentElement.matches('[data-env="dev"]')) {
    return true;
  }

  if (!(target instanceof Element)) {
    return false;
  }

  // Allow context menu on text inputs and contentEditable elements. Checking `maxLength` rules
  // out the input types that hold no text, such as a checkbox or a button.
  return (
    (target.matches('input, textarea') && 'maxLength' in target) ||
    /** @type {HTMLElement | null} */ (target.closest('[role="textbox"]'))?.contentEditable ===
      'true'
  );
};
