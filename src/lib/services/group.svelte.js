import { isRTL } from '@sveltia/i18n';
import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';
import { getSelectedItemDetail } from './select.svelte.js';

/**
 * @import { Attachment } from 'svelte/attachments';
 */

/**
 * Diacritic characters regex for normalization. We use a regex instead of `Intl` APIs for better
 * performance, since `transliterate` is slow and we only need basic normalization.
 */
const DIACRITIC_RE = /\p{Diacritic}/gu;

/**
 * Normalize the given string for search value comparison. Since `transliterate` is slow, we only
 * apply basic normalization.
 * @internal
 * @param {string} value Original value.
 * @returns {string} Normalized value.
 * @todo Move this to `@sveltia/utils`.
 */
export const normalize = (value) => {
  value = value.trim();

  if (!value) {
    return '';
  }

  return value.normalize('NFD').replace(DIACRITIC_RE, '').toLocaleLowerCase();
};

/**
 * @type {{ [role: string]: {
 * orientation: 'vertical' | 'horizontal',
 * childRoles: string[],
 * childSelectedAttr: 'aria-selected' | 'aria-checked',
 * focusChild: boolean
 * selectFirst: boolean
 * controlsPanel: boolean
 * rovingTabStop: 'selected' | 'first'
 * } }}
 */
const config = {
  grid: {
    orientation: 'vertical',
    childRoles: ['row'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
    selectFirst: true,
    controlsPanel: false,
    rovingTabStop: 'selected',
  },
  listbox: {
    orientation: 'vertical',
    childRoles: ['option'],
    childSelectedAttr: 'aria-selected',
    focusChild: false,
    selectFirst: false,
    controlsPanel: false,
    rovingTabStop: 'selected',
  },
  menu: {
    orientation: 'vertical',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
    controlsPanel: false,
    rovingTabStop: 'first',
  },
  menubar: {
    orientation: 'horizontal',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
    controlsPanel: false,
    rovingTabStop: 'first',
  },
  radiogroup: {
    orientation: 'horizontal',
    childRoles: ['radio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
    controlsPanel: false,
    rovingTabStop: 'selected',
  },
  tablist: {
    orientation: 'horizontal',
    childRoles: ['tab'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
    selectFirst: true,
    controlsPanel: true,
    rovingTabStop: 'selected',
  },
};

/**
 * Selector for the elements that can hold focus.
 */
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, summary, [tabindex]';

/**
 * List the document’s tab stops in document order. Positive `tabindex` values, which reorder the
 * sequence, are not accounted for; they’re discouraged and absent from this library.
 * @internal
 * @returns {HTMLElement[]} Elements that can be reached with Tab.
 */
const getTabStops = () =>
  /** @type {HTMLElement[]} */ ([...document.querySelectorAll(FOCUSABLE_SELECTOR)]).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled, [aria-disabled="true"], [hidden], [inert], [inert] *') &&
      !!element.getClientRects().length,
  );

/**
 * Find the element that opens the menu the given element belongs to. A menu lives outside its
 * opener in the DOM tree, so the link runs the other way: the opener points at the menu’s container
 * with `aria-controls`.
 * @internal
 * @param {HTMLElement} element Element within the menu.
 * @returns {HTMLElement | null} Menu button or parent menu item, if any.
 */
const getMenuOpener = (element) => {
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
 * Implement keyboard and mouse interactions for a grouping composite widget.
 */
export class Group {
  /**
   * Initialize a new `Group` instance.
   * @param {HTMLElement} parent Parent element.
   * @param {object} [options] Options.
   * @param {boolean} [options.clickToSelect] Whether to select an item by clicking on it.
   * @todo Check for added elements probably with `MutationObserver`.
   */
  constructor(parent, { clickToSelect = true } = {}) {
    parent.dispatchEvent(new CustomEvent('Initializing'));

    this.parent = parent;
    this.role = /** @type {string} */ (parent.getAttribute('role'));
    this.multi = this.parent.getAttribute('aria-multiselectable') === 'true';
    this.id = generateElementId(this.role);
    this.parentGroupSelector = `[role="group"], [role="${this.role}"]`;
    this.clickToSelect = clickToSelect;

    // eslint-disable-next-line jsdoc/require-description
    /** @type {(event: MouseEvent) => void} */
    this._onClick = (event) => {
      this.onClick(event);
    };

    // eslint-disable-next-line jsdoc/require-description
    /** @type {(event: KeyboardEvent) => void} */
    this._onKeyDown = (event) => {
      this.onKeyDown(event);
    };

    const {
      orientation,
      childRoles,
      childSelectedAttr,
      focusChild,
      selectFirst,
      controlsPanel,
      rovingTabStop,
    } = config[this.role];

    this.orientation = this.grid
      ? 'horizontal'
      : (this.parent.getAttribute('aria-orientation') ?? orientation);
    this.childRoles = childRoles;
    this.childSelectedAttr = childSelectedAttr;
    this.childSelectedProp = childSelectedAttr.replace('aria-', '');
    this.focusChild = focusChild;
    this.selectFirst = selectFirst;
    /**
     * Whether a member’s `aria-controls` target is a panel this group owns, as with a tab and its
     * tabpanel. Only then may the group hide the target when the member isn’t selected. Elsewhere
     * `aria-controls` means something quite different — on a menu item it points at the submenu the
     * item opens, and on a toolbar button at the region it acts on — and hiding those would break
     * the very widget the member controls.
     * @type {boolean}
     */
    this.controlsPanel = controlsPanel;
    /**
     * Which member holds the group’s single tab stop. `selected` suits widgets where one member is
     * the natural entry point, such as the checked radio or the current tab. `first` suits menus,
     * where any number of items can be checked at once, so the checked state says nothing about
     * where the keyboard should land.
     * @type {'selected' | 'first'}
     */
    this.rovingTabStop = rovingTabStop;

    this.parent.tabIndex = focusChild ? -1 : 0;

    // Wait a bit before the relevant components, including the `aria-controls` target are mounted
    (async () => {
      await sleep(100);
      this.activate();
    })();
  }

  /**
   * Activate the members.
   */
  activate() {
    const { parent, allMembers, selected: defaultSelected } = this;

    allMembers.forEach((element, index) => {
      // Select the first one if no member has the `selected` attribute
      const isSelected =
        element.getAttribute(this.childSelectedAttr) === 'true' ||
        (defaultSelected ? element === defaultSelected : this.selectFirst && index === 0);

      const controlTarget = this.controlsPanel
        ? /** @type {HTMLElement | null} */ (
            document.querySelector(`#${element.getAttribute('aria-controls')}`)
          )
        : null;

      element.id ||= `${this.id}-item-${index + 1}`;
      element.setAttribute(this.childSelectedAttr, String(isSelected));

      if (controlTarget) {
        controlTarget.inert = !isSelected;
        controlTarget.setAttribute('aria-labelledby', element.id);
        controlTarget.setAttribute('aria-hidden', String(!isSelected));

        if (isSelected) {
          globalThis.setTimeout(() => {
            try {
              controlTarget.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'auto',
              });
            } catch {
              controlTarget.scrollIntoView(true);
            }
          }, 300);
        }
      }
    });

    this.updateTabStop();
    parent.addEventListener('click', this._onClick);
    parent.addEventListener('keydown', this._onKeyDown);
    parent.dispatchEvent(new CustomEvent('Initialized'));
  }

  /**
   * Put exactly one member in the tab sequence, as a composite widget should. Giving every checked
   * member `tabindex="0"` would scatter tab stops through the widget — a menu with two checked
   * items would take three tab presses to step over.
   */
  updateTabStop() {
    const { allMembers, activeMembers } = this;

    // When the group element itself takes focus, as a listbox does, no member is a tab stop
    if (!this.focusChild) {
      allMembers.forEach((element) => {
        element.tabIndex = -1;
      });

      return;
    }

    const tabStop =
      this.rovingTabStop === 'selected'
        ? (activeMembers.find((element) => element.matches(`[${this.childSelectedAttr}="true"]`)) ??
          activeMembers[0])
        : activeMembers[0];

    allMembers.forEach((element) => {
      element.tabIndex = element === tabStop ? 0 : -1;
    });
  }

  /**
   * CSS selector to retrieve the members.
   * @type {string}
   */
  get selector() {
    return this.childRoles.map((role) => `[role="${role}"]`).join(',');
  }

  /**
   * List of all the members.
   * @type {HTMLElement[]}
   */
  get allMembers() {
    return /** @type {HTMLElement[]} */ ([...this.parent.querySelectorAll(this.selector)]);
  }

  /**
   * List of the enabled and visible members.
   * @type {HTMLElement[]}
   */
  get activeMembers() {
    return this.allMembers.filter(
      (element) => !element.matches('[aria-disabled="true"], [aria-hidden="true"]'),
    );
  }

  /**
   * The element that opens this menu, either a menu button or a menu item in the menu above.
   * @type {HTMLElement | null}
   */
  get opener() {
    return getMenuOpener(this.parent);
  }

  /**
   * The menu item that opens this menu, when this menu is a submenu. A menu button is deliberately
   * excluded, because closing a top-level menu is not what “back to the parent item” means.
   * @type {HTMLElement | null}
   */
  get parentMenuItem() {
    const { opener } = this;

    return opener?.matches('[role^="menuitem"]') ? opener : null;
  }

  /**
   * Close this menu along with every menu above it.
   * @returns {HTMLElement | null} The element that opens the outermost menu, so the caller can
   * hand focus back to it.
   */
  closeMenuChain() {
    const { opener: innermost } = this;
    /** @type {HTMLElement | null} */
    let opener = innermost;
    /** @type {HTMLElement | null} */
    let outermost = null;

    // Bounded, so a malformed `aria-controls` cycle can’t hang the page
    for (let i = 0; i < 10 && opener; i += 1) {
      outermost = opener;

      if (opener.getAttribute('aria-expanded') === 'true') {
        opener.click();
      }

      const menu = /** @type {HTMLElement | null} */ (
        opener.closest('[role="menu"], [role="menubar"]')
      );

      opener = menu ? getMenuOpener(menu) : null;
    }

    return outermost;
  }

  /**
   * Leave the menu the way Tab should: close it along with every menu above it, then carry focus on
   * to whatever follows the outermost opener. The browser can’t be left to do this itself, because
   * a modal `<dialog>` confines Tab to its own contents.
   * @param {boolean} backwards Whether to move to the previous tab stop instead, as Shift+Tab.
   */
  async leaveMenu(backwards) {
    const opener = this.closeMenuChain();

    if (!opener) {
      return;
    }

    // Somewhere to stand while the menu is torn down, and the fallback if there’s nothing beyond
    opener.focus();
    await sleep(50);

    const tabStops = getTabStops();
    const index = tabStops.indexOf(opener);

    if (index > -1) {
      tabStops[index + (backwards ? -1 : 1)]?.focus();
    }
  }

  /**
   * Open the submenu of the given menu item if needed, and move focus onto its first item.
   * @param {HTMLElement} item Menu item with `aria-haspopup="menu"`.
   */
  async enterSubmenu(item) {
    const submenuId = item.getAttribute('aria-controls');

    if (!submenuId) {
      return;
    }

    if (item.getAttribute('aria-expanded') !== 'true') {
      item.click();
    }

    const submenu = document.getElementById(submenuId);

    // The submenu is revealed and positioned asynchronously, and an element that is still hidden
    // or invisible cannot take focus, so keep trying for a few frames
    for (let i = 0; i < 20; i += 1) {
      const first = /** @type {HTMLElement | undefined} */ (
        [...(submenu?.querySelectorAll(this.selector) ?? [])].find(
          (element) => !element.matches('[aria-disabled="true"], [aria-hidden="true"]'),
        )
      );

      first?.focus();

      if (first && document.activeElement === first) {
        return;
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(20);
    }
  }

  /**
   * Close this submenu and move focus back onto the menu item that opens it.
   * @param {HTMLElement} item Menu item with `aria-haspopup="menu"`.
   */
  leaveSubmenu(item) {
    if (item.getAttribute('aria-expanded') === 'true') {
      item.click();
    }

    item.focus();
  }

  /**
   * Get the currently selected member.
   * @type {HTMLElement | undefined}
   */
  get selected() {
    return this.activeMembers.find((element) =>
      element.matches(`[${this.childSelectedAttr}="true"]`),
    );
  }

  /**
   * Whether the parent is disabled.
   * @type {boolean}
   */
  get isDisabled() {
    return this.parent.matches('[aria-disabled="true"]');
  }

  /**
   * Whether the parent is read-only.
   * @type {boolean}
   */
  get isReadOnly() {
    return this.parent.matches('[aria-readonly="true"]');
  }

  /**
   * Whether the widget is displayed in grid mode.
   * @type {boolean}
   */
  get grid() {
    return this.role === 'grid' || (this.role === 'listbox' && this.parent.matches('.grid'));
  }

  /**
   * Select (and move focus to) the given target.
   * @param {(MouseEvent | KeyboardEvent)} event Triggered event.
   * @param {HTMLElement} newTarget Target element.
   */
  selectTarget(event, newTarget) {
    if (this.isDisabled || this.isReadOnly) {
      event.preventDefault();

      return;
    }

    const targetRole = newTarget.getAttribute('role');
    const targetParent = newTarget.closest(this.parentGroupSelector);
    const selectByClick = event.type === 'click';

    const selectByKeydown =
      event.type === 'keydown' && /** @type {KeyboardEvent} */ (event).key === ' ';

    this.activeMembers.forEach((element) => {
      const isMenuItemCheckbox = element.matches('[role="menuitemcheckbox"]');
      const isMenuItemRadio = element.matches('[role="menuitemradio"]');

      if (
        (isMenuItemCheckbox || isMenuItemRadio) &&
        (element.getAttribute('role') !== targetRole ||
          element.closest(this.parentGroupSelector) !== targetParent)
      ) {
        return;
      }

      const multiSelect = isMenuItemCheckbox || this.multi;
      const singleSelect = isMenuItemRadio || !multiSelect;
      const isTarget = element === newTarget;
      const isSelected = element.matches(`[${this.childSelectedAttr}="true"]`);
      const controlTargetId = this.controlsPanel ? element.getAttribute('aria-controls') : null;
      const controlTarget = controlTargetId ? document.getElementById(controlTargetId) : null;

      if (multiSelect && isTarget && (selectByClick || selectByKeydown)) {
        element.setAttribute(this.childSelectedAttr, String(!isSelected));
        element.dispatchEvent(
          new CustomEvent('Change', { detail: { [this.childSelectedProp]: !isSelected } }),
        );

        if (!isSelected) {
          element.dispatchEvent(new CustomEvent('Select'));
        }
      }

      if (
        singleSelect &&
        isSelected !== isTarget &&
        (isMenuItemRadio ? selectByKeydown || selectByClick : true)
      ) {
        element.setAttribute(this.childSelectedAttr, String(isTarget));
        element.dispatchEvent(
          new CustomEvent('Change', { detail: { [this.childSelectedProp]: isTarget } }),
        );

        if (isTarget) {
          if (event.type === 'keydown' && element.matches('[role="radio"]')) {
            element.click();
          }

          element.dispatchEvent(new CustomEvent('Select'));
        }
      }

      if (this.focusChild) {
        // Wait a bit before the element is rerendered
        globalThis.requestAnimationFrame(() => {
          element.tabIndex = isTarget ? 0 : -1;

          if (isTarget) {
            element.focus();
            element.dispatchEvent(new CustomEvent('Focus'));
          }
        });
      } else {
        element.classList.toggle('focused', isTarget);

        if (isTarget) {
          element.dispatchEvent(new CustomEvent('Focus'));
        }
      }

      if (controlTarget) {
        controlTarget.inert = !isTarget;
        controlTarget.setAttribute('aria-hidden', String(!isTarget));

        if (isTarget) {
          globalThis.setTimeout(() => {
            try {
              controlTarget.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'auto',
              });
            } catch {
              controlTarget.scrollIntoView(true);
            }
          }, 300);
        }
      }

      if (isTarget) {
        this.parent.setAttribute('aria-activedescendant', element.id);

        globalThis.setTimeout(() => {
          try {
            element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
          } catch {
            element.scrollIntoView(true);
          }
        }, 300);
      }
    });

    this.parent.dispatchEvent(
      new CustomEvent('Change', { detail: getSelectedItemDetail(newTarget) }),
    );
  }

  /**
   * Handle the `click` event on the widget.
   * @param {MouseEvent} event `click` event.
   */
  onClick(event) {
    // eslint-disable-next-line prefer-destructuring
    const target = /** @type {HTMLElement} */ (event.target);

    const newTarget = target.matches(this.selector)
      ? target
      : /** @type {HTMLElement | null} */ (target.closest(this.selector));

    if (!newTarget || event.button !== 0 || !this.clickToSelect) {
      return;
    }

    this.selectTarget(event, newTarget);
  }

  /**
   * Handle the `keydown` event on the widget.
   * @param {KeyboardEvent} event `keydown` event.
   */
  onKeyDown(event) {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const hasModifier = shiftKey || altKey || ctrlKey || metaKey;
    const isMenu = this.childRoles.includes('menuitem');

    // Tab leaves the menu entirely rather than stepping through it. Shift is allowed through here,
    // unlike the keys below, because Shift+Tab leaves the menu just the same.
    if (key === 'Tab' && isMenu && !ctrlKey && !metaKey && !altKey) {
      event.preventDefault();
      this.leaveMenu(shiftKey);

      return;
    }

    if (hasModifier) {
      return;
    }

    // eslint-disable-next-line prefer-destructuring
    const target = /** @type {HTMLElement} */ (event.target);
    const { allMembers, activeMembers } = this;

    /** @type {HTMLElement | undefined} */
    const currentTarget = (() => {
      if (!this.focusChild) {
        return activeMembers.find((member) => member.matches('.focused'));
      }

      if (target.matches(this.selector)) {
        return target;
      }

      return undefined;
    })();

    if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
    }

    if (key === 'Enter') {
      currentTarget?.click(); // Also close the popup if needed

      return;
    }

    if (key === ' ') {
      if (currentTarget) {
        this.selectTarget(event, currentTarget);
      }

      return;
    }

    // Escape in a submenu dismisses just that submenu. Propagation is stopped so the popup, whose
    // own Escape handler sits on the `<dialog>` this submenu shares with its parent, doesn’t go on
    // to close the whole stack.
    if (key === 'Escape' && isMenu) {
      const { parentMenuItem } = this;

      if (parentMenuItem) {
        event.preventDefault();
        event.stopPropagation();
        this.leaveSubmenu(parentMenuItem);

        return;
      }
    }

    // Submenu traversal. In a vertical menu the inline arrows are free, so they step into a submenu
    // and back out again, as the Menu pattern expects. Mirrored for RTL.
    if (this.orientation === 'vertical' && isMenu) {
      const intoSubmenuKey = isRTL() ? 'ArrowLeft' : 'ArrowRight';
      const outOfSubmenuKey = isRTL() ? 'ArrowRight' : 'ArrowLeft';

      if (key === intoSubmenuKey && currentTarget?.getAttribute('aria-haspopup') === 'menu') {
        this.enterSubmenu(currentTarget);

        return;
      }

      if (key === outOfSubmenuKey) {
        const { parentMenuItem } = this;

        if (parentMenuItem) {
          this.leaveSubmenu(parentMenuItem);

          return;
        }
      }
    }

    let index;
    let newTarget;

    if (this.grid) {
      const colCount = Math.floor(this.parent.clientWidth / activeMembers[0].clientWidth);
      const _isRTL = isRTL();

      index = currentTarget ? allMembers.indexOf(currentTarget) : -1;

      if (key === 'ArrowUp' && index > 0) {
        newTarget = allMembers[index - colCount];
      }

      if (key === 'ArrowDown' && index < allMembers.length - 1) {
        newTarget = allMembers[index + colCount];
      }

      // In RTL, ArrowLeft moves right (next), ArrowRight moves left (previous)
      if (key === 'ArrowLeft' && index > 0) {
        newTarget = allMembers[index + (_isRTL ? 1 : -1)];
      }

      if (key === 'ArrowRight' && index < allMembers.length - 1) {
        newTarget = allMembers[index + (_isRTL ? -1 : 1)];
      }

      if (newTarget?.matches('[aria-disabled="true"], [aria-hidden="true"]')) {
        newTarget = undefined;
      }
    } else {
      index = currentTarget ? activeMembers.indexOf(currentTarget) : -1;

      const _isRTL = isRTL();

      // For horizontal orientation in RTL: ArrowLeft moves forward, ArrowRight moves backward
      const prevKey =
        this.orientation === 'horizontal' ? (_isRTL ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';

      const nextKey =
        this.orientation === 'horizontal' ? (_isRTL ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';

      if (key === prevKey) {
        if (index > 0) {
          // Previous member
          newTarget = activeMembers[index - 1];
        }

        if (index <= 0) {
          // Last member (also handles the case when nothing is focused, index === -1)
          newTarget = activeMembers[activeMembers.length - 1];
        }
      }

      if (key === nextKey) {
        if (index < activeMembers.length - 1) {
          // Next member
          newTarget = activeMembers[index + 1];
        }

        if (index === activeMembers.length - 1) {
          // First member
          [newTarget] = activeMembers;
        }
      }
    }

    if (newTarget && newTarget !== currentTarget) {
      this.selectTarget(event, newTarget);
    }
  }

  /**
   * Clean up event listeners.
   */
  destroy() {
    this.parent.removeEventListener('click', this._onClick);
    this.parent.removeEventListener('keydown', this._onKeyDown);
  }

  /**
   * Called whenever the params are updated. Filter the items based on the search terms.
   * @param {{ searchTerms: string }} params Updated params.
   */
  onUpdate({ searchTerms }) {
    const terms = normalize(searchTerms);
    const _terms = terms ? terms.split(/\s+/) : [];
    const { allMembers, parent } = this;

    const matched = allMembers
      .map((member) => {
        const searchValue = normalize(
          member.dataset.searchValue ??
            member.dataset.label ??
            member.querySelector('.label')?.textContent ??
            /** @type {string} */ (member.textContent),
        );

        const hidden = !_terms.every((term) => searchValue.includes(term));

        member.dispatchEvent(new CustomEvent('Toggle', { detail: { hidden } }));

        return hidden;
      })
      .filter((hidden) => !hidden).length;

    parent.dispatchEvent(
      new CustomEvent('Filter', { detail: { matched, total: allMembers.length } }),
    );
  }
}

/**
 * Activate a new group.
 * @param {object | (() => object)} [paramsOrGetter] Params object or a getter function for reactive
 * params.
 * @returns {Attachment} Attachment.
 */
export const activateGroup = (paramsOrGetter) => (parent) => {
  const isGetter = typeof paramsOrGetter === 'function';
  const initialParams = isGetter ? paramsOrGetter() : paramsOrGetter;
  const group = new Group(/** @type {HTMLElement} */ (parent), initialParams);

  /* v8 ignore next 4 */
  if (isGetter) {
    $effect(() => {
      group.onUpdate(paramsOrGetter());
    });
  }

  return () => {
    group.destroy();
  };
};
