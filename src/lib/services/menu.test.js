import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closeMenuChain,
  enterSubmenu,
  getMenuOpener,
  getParentMenuItem,
  handleMenuKey,
  leaveSubmenu,
} from './menu.js';

/**
 * @import { Group } from './group.svelte.js';
 */

/**
 * Create a menu item.
 * @param {string} label Text label.
 * @returns {HTMLElement} Element.
 */
const makeItem = (label) => {
  const el = document.createElement('div');

  el.setAttribute('role', 'menuitem');
  el.tabIndex = -1;
  el.textContent = label;

  return el;
};

/**
 * Create a menu, wrapped in a container with the given ID that its opener points at.
 * @param {string} id Container ID.
 * @param {HTMLElement[]} items Menu items.
 * @returns {{ container: HTMLElement, menu: HTMLElement }} Elements.
 */
const makeMenu = (id, items) => {
  const container = document.createElement('div');
  const menu = document.createElement('div');

  container.id = id;
  menu.setAttribute('role', 'menu');
  menu.append(...items);
  container.appendChild(menu);

  return { container, menu };
};

/**
 * Create a stand-in for the group the key handler is called with.
 * @param {HTMLElement} parent Menu element.
 * @param {string} [orientation] Orientation.
 * @returns {Group} Group-like object.
 */
const fakeGroup = (parent, orientation = 'vertical') =>
  /** @type {Group} */ (
    /** @type {unknown} */ ({ parent, orientation, selector: '[role="menuitem"]' })
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('getMenuOpener / getParentMenuItem', () => {
  it('finds the opener through the aria-controls of an ancestor', () => {
    const button = document.createElement('button');
    const { container, menu } = makeMenu('top', [makeItem('One')]);

    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-controls', 'top');
    document.body.append(button, container);
    expect(getMenuOpener(menu)).toBe(button);
    // A menu button isn’t a parent menu item
    expect(getParentMenuItem(menu)).toBeNull();
  });

  it('returns the parent menu item of a submenu', () => {
    const opener = makeItem('Opener');
    const { container, menu } = makeMenu('sub', [makeItem('Child')]);

    opener.setAttribute('aria-haspopup', 'menu');
    opener.setAttribute('aria-controls', 'sub');
    document.body.append(opener, container);
    expect(getParentMenuItem(menu)).toBe(opener);
  });

  it('returns null without an opener', () => {
    const { container, menu } = makeMenu('lonely', [makeItem('One')]);

    document.body.append(container);
    expect(getMenuOpener(menu)).toBeNull();
    expect(getParentMenuItem(menu)).toBeNull();
  });
});

describe('closeMenuChain', () => {
  it('collapses every expanded opener up the chain and returns the outermost one', () => {
    const button = document.createElement('button');
    const opener = makeItem('Opener');
    const top = makeMenu('top', [opener]);
    const sub = makeMenu('sub', [makeItem('Child')]);
    const buttonClick = vi.fn();
    const openerClick = vi.fn();

    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-controls', 'top');
    button.setAttribute('aria-expanded', 'true');
    button.addEventListener('click', buttonClick);
    opener.setAttribute('aria-haspopup', 'menu');
    opener.setAttribute('aria-controls', 'sub');
    opener.setAttribute('aria-expanded', 'false');
    opener.addEventListener('click', openerClick);
    document.body.append(button, top.container, sub.container);

    expect(closeMenuChain(sub.menu)).toBe(button);
    expect(buttonClick).toHaveBeenCalledOnce();
    // Already collapsed, so left alone
    expect(openerClick).not.toHaveBeenCalled();
  });
});

describe('enterSubmenu / leaveSubmenu', () => {
  /** @type {HTMLElement} */
  let opener;

  beforeEach(() => {
    const { container } = makeMenu('menu', [makeItem('Opener')]);

    opener = /** @type {HTMLElement} */ (container.querySelector('[role="menuitem"]'));
    opener.setAttribute('aria-haspopup', 'menu');
    document.body.appendChild(container);
  });

  it('should give up gracefully when aria-controls references a non-existent element', async () => {
    opener.setAttribute('aria-controls', 'does-not-exist');
    opener.setAttribute('aria-expanded', 'true');

    // document.getElementById() resolves to null, so the retry loop searches an empty list on
    // every iteration; it should exhaust without throwing
    await expect(enterSubmenu(opener, '[role="menuitem"]')).resolves.toBeUndefined();
  }, 10000);

  it('does nothing without aria-controls', async () => {
    const clicked = vi.fn();

    opener.addEventListener('click', clicked);
    await enterSubmenu(opener, '[role="menuitem"]');
    expect(clicked).not.toHaveBeenCalled();
  });

  it('should not click an already-collapsed item when leaving its submenu', () => {
    const clicked = vi.fn();

    opener.addEventListener('click', clicked);
    opener.setAttribute('aria-expanded', 'false');
    leaveSubmenu(opener);

    expect(clicked).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });
});

describe('handleMenuKey', () => {
  /** @type {HTMLElement} */
  let opener;
  /** @type {{ container: HTMLElement, menu: HTMLElement }} */
  let sub;

  beforeEach(() => {
    opener = makeItem('Opener');
    sub = makeMenu('sub', [makeItem('Child')]);
    opener.setAttribute('aria-haspopup', 'menu');
    opener.setAttribute('aria-controls', 'sub');
    document.body.append(opener, sub.container);
  });

  /**
   * Create a `keydown` event.
   * @param {string} key Key.
   * @param {KeyboardEventInit} [init] Other properties.
   * @returns {KeyboardEvent} Event.
   */
  const keyDown = (key, init = {}) =>
    new KeyboardEvent('keydown', { key, cancelable: true, ...init });

  it('claims Tab, even in a menu with no opener', () => {
    const { container, menu } = makeMenu('inline', [makeItem('One')]);
    const event = keyDown('Tab');

    document.body.append(container);
    expect(handleMenuKey(fakeGroup(menu), event, undefined)).toBe(true);
    // Left to the browser
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves Ctrl+Tab and modified keys to the group', () => {
    expect(handleMenuKey(fakeGroup(sub.menu), keyDown('Tab', { ctrlKey: true }), undefined)).toBe(
      false,
    );
    expect(
      handleMenuKey(fakeGroup(sub.menu), keyDown('Escape', { shiftKey: true }), undefined),
    ).toBe(false);
  });

  it('leaves a submenu with Escape and ArrowLeft', () => {
    const escape = keyDown('Escape');

    expect(handleMenuKey(fakeGroup(sub.menu), escape, undefined)).toBe(true);
    expect(escape.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(opener);
    expect(handleMenuKey(fakeGroup(sub.menu), keyDown('ArrowLeft'), undefined)).toBe(true);
  });

  it('leaves Escape and the inline arrows alone in a top-level or horizontal menu', () => {
    const { container, menu } = makeMenu('inline', [makeItem('One')]);

    document.body.append(container);
    expect(handleMenuKey(fakeGroup(menu), keyDown('Escape'), undefined)).toBe(false);
    expect(handleMenuKey(fakeGroup(menu), keyDown('ArrowLeft'), undefined)).toBe(false);
    expect(handleMenuKey(fakeGroup(sub.menu, 'horizontal'), keyDown('ArrowLeft'), undefined)).toBe(
      false,
    );
  });

  it('steps into a submenu with ArrowRight', () => {
    const clicked = vi.fn();
    const event = keyDown('ArrowRight');

    opener.addEventListener('click', clicked);
    expect(handleMenuKey(fakeGroup(sub.menu), event, opener)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(clicked).toHaveBeenCalledOnce();
    // A plain item doesn’t open anything
    expect(handleMenuKey(fakeGroup(sub.menu), keyDown('ArrowRight'), makeItem('Plain'))).toBe(
      false,
    );
  });
});
