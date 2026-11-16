/**
 * Menu behavior on top of the `Group` composite widget: leaving a menu with Tab, and stepping into
 * and out of submenus with the inline arrows and Escape, per the ARIA Menu pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */

import { isRTL } from '@sveltia/i18n';
import { sleep } from '@sveltia/utils/misc';
import { focusAdjacentTabStop } from './focus.js';
import { getArrowKeys, hasModifier, INACTIVE_MEMBER_SELECTOR } from './navigation.js';

/**
 * @import { Group } from './group.svelte.js';
 */

/**
 * Find the element that opens the menu the given element belongs to. A menu lives outside its
 * opener in the DOM tree, so the link runs the other way: the opener points at the menu’s container
 * with `aria-controls`.
 * @internal
 * @param {HTMLElement} element Element within the menu.
 * @returns {HTMLElement | null} Menu button or parent menu item, if any.
 */
export const getMenuOpener = (element) => {
  /** @type {HTMLElement | null} */
  let current = element;

  while (current) {
    if (current.id) {
      const opener = /** @type {HTMLElement | null} */ (
        document.querySelector(`[aria-haspopup="menu"][aria-controls="${CSS.escape(current.id)}"]`)
      );

      if (opener) {
        return opener;
      }
    }

    current = current.parentElement;
  }

  return null;
};

/**
 * Find the menu item that opens the given menu, when it’s a submenu. A menu button is deliberately
 * excluded, because closing a top-level menu is not what “back to the parent item” means.
 * @internal
 * @param {HTMLElement} menu Menu element.
 * @returns {HTMLElement | null} Parent menu item, if any.
 */
export const getParentMenuItem = (menu) => {
  const opener = getMenuOpener(menu);

  return opener?.matches('[role^="menuitem"]') ? opener : null;
};

/**
 * Close the given menu along with every menu above it.
 * @internal
 * @param {HTMLElement} menu Menu element.
 * @returns {HTMLElement | null} The element that opens the outermost menu, so the caller can hand
 * focus back to it.
 */
export const closeMenuChain = (menu) => {
  /** @type {HTMLElement | null} */
  let opener = getMenuOpener(menu);
  /** @type {HTMLElement | null} */
  let outermost = null;

  // Bounded, so a malformed `aria-controls` cycle can’t hang the page
  for (let i = 0; i < 10 && opener; i += 1) {
    outermost = opener;

    if (opener.getAttribute('aria-expanded') === 'true') {
      opener.click();
    }

    const parentMenu = /** @type {HTMLElement | null} */ (
      opener.closest('[role="menu"], [role="menubar"]')
    );

    opener = parentMenu ? getMenuOpener(parentMenu) : null;
  }

  return outermost;
};

/**
 * Leave the menu the way Tab should: close it along with every menu above it, then carry focus on
 * to whatever follows the outermost opener. The browser can’t be left to do this itself, because a
 * modal `<dialog>` confines Tab to its own contents.
 * @internal
 * @param {HTMLElement} menu Menu element.
 * @param {boolean} backwards Whether to move to the previous tab stop instead, as Shift+Tab.
 */
export const leaveMenu = async (menu, backwards) => {
  const opener = closeMenuChain(menu);

  if (!opener) {
    return;
  }

  // Somewhere to stand while the menu is torn down, and the fallback if there’s nothing beyond
  opener.focus();
  await sleep(50);
  focusAdjacentTabStop(opener, backwards);
};

/**
 * Open the submenu of the given menu item if needed, and move focus onto its first item.
 * @internal
 * @param {HTMLElement} item Menu item with `aria-haspopup="menu"`.
 * @param {string} selector CSS selector matching the menu items.
 */
export const enterSubmenu = async (item, selector) => {
  const submenuId = item.getAttribute('aria-controls');

  if (!submenuId) {
    return;
  }

  if (item.getAttribute('aria-expanded') !== 'true') {
    item.click();
  }

  const submenu = document.getElementById(submenuId);

  // The submenu is revealed and positioned asynchronously, and an element that is still hidden or
  // invisible cannot take focus, so keep trying for a few frames
  for (let i = 0; i < 20; i += 1) {
    const first = /** @type {HTMLElement | undefined} */ (
      [...(submenu?.querySelectorAll(selector) ?? [])].find(
        (element) => !element.matches(INACTIVE_MEMBER_SELECTOR),
      )
    );

    first?.focus();

    if (first && document.activeElement === first) {
      return;
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(20);
  }
};

/**
 * Close a submenu and move focus back onto the menu item that opens it.
 * @internal
 * @param {HTMLElement} item Menu item with `aria-haspopup="menu"`.
 */
export const leaveSubmenu = (item) => {
  if (item.getAttribute('aria-expanded') === 'true') {
    item.click();
  }

  item.focus();
};

/**
 * Handle the keys that only a menu responds to: Tab, which leaves the menu entirely rather than
 * stepping through it, Escape, which dismisses just a submenu, and the inline arrows, which step
 * into a submenu and back out again. Called by the group before its own handling, once it has left
 * the keys pressed in a text field to that field.
 * @internal
 * @param {Group} group Menu or menubar group.
 * @param {KeyboardEvent} event `keydown` event.
 * @param {HTMLElement | undefined} currentTarget Member the key was pressed on, if any.
 * @returns {boolean} Whether the key has been dealt with, so the group must leave it alone.
 */
export const handleMenuKey = (group, event, currentTarget) => {
  const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
  const { parent } = group;

  // Shift is allowed through here, unlike the keys below, because Shift+Tab leaves the menu just
  // the same. A menu rendered inline, with no opener to return to, leaves Tab to the browser to
  // move focus on as usual.
  if (key === 'Tab' && !ctrlKey && !metaKey && !altKey) {
    if (getMenuOpener(parent)) {
      event.preventDefault();
      leaveMenu(parent, shiftKey);
    }

    return true;
  }

  if (hasModifier(event)) {
    return false;
  }

  // Escape in a submenu dismisses just that submenu. Propagation is stopped so the popup, whose own
  // Escape handler sits on the `<dialog>` this submenu shares with its parent, doesn’t go on to
  // close the whole stack.
  if (key === 'Escape') {
    const parentMenuItem = getParentMenuItem(parent);

    if (parentMenuItem) {
      event.preventDefault();
      event.stopPropagation();
      leaveSubmenu(parentMenuItem);

      return true;
    }

    return false;
  }

  // Submenu traversal. In a vertical menu the inline arrows are free, so they step into a submenu
  // and back out again, as the Menu pattern expects. Mirrored for RTL.
  if (group.orientation !== 'vertical') {
    return false;
  }

  const { prevKey: outOfSubmenuKey, nextKey: intoSubmenuKey } = getArrowKeys('horizontal', isRTL());

  if (key === intoSubmenuKey && currentTarget?.getAttribute('aria-haspopup') === 'menu') {
    event.preventDefault();
    enterSubmenu(currentTarget, group.selector);

    return true;
  }

  if (key === outOfSubmenuKey) {
    const parentMenuItem = getParentMenuItem(parent);

    if (parentMenuItem) {
      event.preventDefault();
      leaveSubmenu(parentMenuItem);

      return true;
    }
  }

  return false;
};
