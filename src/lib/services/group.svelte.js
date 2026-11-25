import { isRTL } from '@sveltia/i18n';
import { generateElementId } from '@sveltia/utils/element';
import { CompositeWidget, createWidgetAttachment } from './composite-widget.svelte.js';
import { setFocusedMember } from './focus.js';
import { scrollIntoViewIfNeeded } from './scroll.js';
import { getItemLabel, normalize } from './text.js';
import { isPrintableKey } from './type-ahead.js';
import { handleMenuKey } from './menu.js';
import {
  getArrowKeys,
  getGridTargetIndex,
  getLinearTargetIndex,
  hasModifier,
  INACTIVE_MEMBER_SELECTOR,
  isDisabled,
} from './navigation.js';

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
    // Rows are data, not a choice the widget has to make on the user’s behalf: nothing is
    // selected until the user selects it. The first row is only the tab stop.
    selectFirst: false,
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
 * Check whether the given member can hold a selected state. A plain menu item is an action, not a
 * choice, so it has no checked state, and a member marked with `data-selectable="false"`, such as
 * the caption row of a collapsible row group in a grid, can be focused but not selected.
 * @internal
 * @param {HTMLElement} element Member element.
 * @param {string | null} [role] The member’s role, if already read.
 * @returns {boolean} Result.
 */
const isSelectable = (element, role = element.getAttribute('role')) =>
  role !== 'menuitem' && element.dataset.selectable !== 'false';

/**
 * Implement keyboard and mouse interactions for a grouping composite widget.
 */
export class Group extends CompositeWidget {
  /**
   * Observer of the members’ selected state, for the widgets whose panels or tab stop follow it.
   * @type {MutationObserver | undefined}
   */
  selectionObserver = undefined;

  /**
   * Timer for the pending {@link scrollIntoViewLater} call, if any.
   * @type {ReturnType<typeof setTimeout> | undefined}
   */
  #scrollTimer = undefined;

  /**
   * Memoized member lists, discarded whenever the widget’s subtree changes. See {@link #members}.
   * @type {{ all: HTMLElement[], active: HTMLElement[] } | undefined}
   */
  #memberCache = undefined;

  /**
   * Normalized search value of each member, kept alongside the raw value it was derived from so it
   * can be reused until the member’s label actually changes. Filtering runs over every member on
   * every keystroke, and `normalize()` is not free — it decomposes the string and strips the
   * diacritics.
   * @type {WeakMap<HTMLElement, { raw: string, normalized: string }>}
   */
  #searchValueCache = new WeakMap();

  /**
   * Hidden state each member was last told about, so the filter can skip the members whose state
   * hasn’t moved. The DOM is deliberately not consulted for this: the listener updates a component,
   * which renders asynchronously, so two keystrokes within a frame would read a stale attribute.
   * @type {WeakMap<HTMLElement, boolean>}
   */
  #hiddenState = new WeakMap();

  /**
   * Whether {@link selectTarget} is clicking a radio button to have its component check it, so the
   * click that comes back to {@link onClick} is not handled as a second selection.
   * @type {boolean}
   */
  #clickingRadio = false;

  /**
   * Get the normalized value a member is searched by, computing it only when the underlying raw
   * value has changed since the last call.
   * @param {HTMLElement} member Member element.
   * @returns {string} Normalized search value.
   */
  #getNormalizedSearchValue(member) {
    const raw = member.dataset.searchValue ?? getItemLabel(member);
    const cached = this.#searchValueCache.get(member);

    if (cached?.raw === raw) {
      return cached.normalized;
    }

    const normalized = normalize(raw);

    this.#searchValueCache.set(member, { raw, normalized });

    return normalized;
  }

  /**
   * Get the panel a member controls, if the group owns such panels. See {@link controlsPanel}.
   * @param {HTMLElement} member Member element.
   * @returns {HTMLElement | null} The member’s `aria-controls` target, or `null` if there’s none
   * or the group doesn’t own its members’ targets.
   */
  #getControlTarget(member) {
    const controlTargetId = this.controlsPanel ? member.getAttribute('aria-controls') : null;

    // Looked up by ID rather than with a selector, which would throw on an ID that isn’t a valid
    // CSS identifier, such as one starting with a digit
    return controlTargetId ? document.getElementById(controlTargetId) : null;
  }

  /**
   * Show or hide a panel controlled by a member, both to the user and to assistive technology.
   * @param {HTMLElement} panel Panel element.
   * @param {boolean} shown Whether the panel is to be shown.
   */
  #setPanelShown(panel, shown) {
    panel.inert = !shown;
    panel.setAttribute('aria-hidden', String(!shown));
  }

  /**
   * Initialize a new `Group` instance.
   * @param {HTMLElement} parent Parent element.
   * @param {object} [options] Options.
   * @param {boolean} [options.clickToSelect] Whether to select an item by clicking on it.
   */
  constructor(parent, { clickToSelect = true } = {}) {
    super(parent);

    this.role = /** @type {string} */ (parent.getAttribute('role'));
    this.multi = this.parent.getAttribute('aria-multiselectable') === 'true';
    this.id = generateElementId(this.role);
    this.parentGroupSelector = `[role="group"], [role="${this.role}"]`;
    this.clickToSelect = clickToSelect;

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

    // The members can be added, removed, disabled or hidden at any time, which is what invalidates
    // the cached lists. Only the attributes that decide membership are watched, so the group’s own
    // writes — the selected state and the roving `tabindex` — don’t needlessly discard the cache.
    // Connected in `setUp()`; see there.
    this.observer = new globalThis.MutationObserver((records) => {
      if (!this.#affectsMembers(records)) {
        return;
      }

      this.#memberCache = undefined;

      // Members rendered after activation — rows that arrive with the data, say — start out with
      // whatever `tabindex` their component gives them, so the roving tab stop has to be redone
      // for them to become a single stop
      if (records.some(({ type }) => type === 'childList')) {
        this.updateTabStop();
      }
    });

    // A member can also be selected from code, as when a `<Tab>`’s `selected` prop changes. The
    // group’s own writes are already in sync, so this only matters for the ones made elsewhere: the
    // panels and the roving tab stop have to follow the new selection.
    if (controlsPanel || (focusChild && rovingTabStop === 'selected')) {
      this.selectionObserver = new globalThis.MutationObserver(() => {
        this.syncSelection();
      });
    }

    // Listen right away: a click or a key press that comes before the activation below activates
    // the members first, rather than being lost
    this.listen('click', (event) => this.onClick(event));
    this.listen('keydown', (event) => this.onKeyDown(event));
  }

  /**
   * Set up the members on activation. The observers are only connected here, rather than in the
   * constructor, so a widget unmounted before its activation leaves nothing to disconnect, and the
   * member lists are only cached from here on, once the observer can tell when they go stale.
   * @override
   */
  setUp() {
    const { allMembers, selected: defaultSelected } = this;
    /** @type {HTMLElement[]} */
    const shownPanels = [];

    allMembers.forEach((element, index) => {
      // Select the first one if no member has the `selected` attribute
      const isSelected =
        element.getAttribute(this.childSelectedAttr) === 'true' ||
        (defaultSelected ? element === defaultSelected : this.selectFirst && index === 0);

      const controlTarget = this.#getControlTarget(element);

      element.id ||= `${this.id}-item-${index + 1}`;

      if (isSelectable(element)) {
        element.setAttribute(this.childSelectedAttr, String(isSelected));
      }

      if (controlTarget) {
        controlTarget.setAttribute('aria-labelledby', element.id);
        this.#setPanelShown(controlTarget, isSelected);

        if (isSelected) {
          shownPanels.push(controlTarget);
        }
      }
    });

    if (shownPanels.length) {
      this.scrollIntoViewLater(shownPanels);
    }

    this.updateTabStop();

    this.observer.observe(this.parent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-disabled', 'aria-hidden'],
    });

    this.selectionObserver?.observe(this.parent, {
      subtree: true,
      attributes: true,
      attributeFilter: [this.childSelectedAttr],
    });
  }

  /**
   * Put exactly one member in the tab sequence, as a composite widget should. Giving every checked
   * member `tabindex="0"` would scatter tab stops through the widget — a menu with two checked
   * items would take three tab presses to step over.
   */
  updateTabStop() {
    // When the group element itself takes focus, as a listbox does, no member is a tab stop
    if (!this.focusChild) {
      this.setTabStop(undefined);

      return;
    }

    const { activeMembers } = this;

    // This runs again whenever the subtree changes, so a member the user has moved to must not be
    // handed back to the selected or first one just because a cell re-rendered or a row arrived
    this.setTabStop(
      this.pickTabStop(activeMembers, () =>
        this.rovingTabStop === 'selected' ? this.selected : undefined,
      ),
    );
  }

  /**
   * Bring the panels and the roving tab stop in line with the members’ selected state, after it has
   * been changed from outside the group.
   */
  syncSelection() {
    const { allMembers, parent } = this;

    if (this.controlsPanel) {
      allMembers.forEach((element) => {
        const controlTarget = this.#getControlTarget(element);

        if (controlTarget) {
          this.#setPanelShown(
            controlTarget,
            element.getAttribute(this.childSelectedAttr) === 'true',
          );
        }
      });
    }

    // The tab stop moves to the newly selected member, unless the user is in the widget, in which
    // case it stays where they are
    if (this.focusChild && !parent.contains(document.activeElement)) {
      const { selected } = this;

      if (selected) {
        this.setTabStop(selected);
      }
    }
  }

  /**
   * Count the columns of a grid layout from where the members sit, rather than from their widths:
   * a row of a data grid spans the full width, a tile in a grid listbox doesn’t, and a header row
   * may have no box at all.
   * @returns {number} Number of members per visual row, at least 1.
   */
  get columnCount() {
    // Members without a layout box don’t occupy a column
    const laidOut = this.allMembers.filter((member) => member.getClientRects().length);
    const firstTop = laidOut[0]?.getBoundingClientRect().top;

    const count = laidOut.findIndex(
      (member) => Math.abs(member.getBoundingClientRect().top - firstTop) > 1,
    );

    // Everything on one visual row when nothing wraps
    return Math.max(1, count === -1 ? laidOut.length : count);
  }

  /**
   * CSS selector to retrieve the members.
   * @type {string}
   */
  get selector() {
    return this.childRoles.map((role) => `[role="${role}"]`).join(',');
  }

  /**
   * The member lists, recomputed only once the widget’s subtree has actually changed. A single
   * arrow key reaches these several times over, and a composite widget can hold thousands of
   * members, so the `querySelectorAll` and the `matches()` per member that back them are far too
   * expensive to repeat on every read.
   *
   * The observer’s pending records are drained here rather than left to its callback, which runs a
   * microtask later — too late for a read that happens synchronously after a mutation, as when a
   * key is dispatched right after the members are swapped out.
   * @type {{ all: HTMLElement[], active: HTMLElement[] }}
   */
  get #members() {
    if (this.#affectsMembers(this.observer.takeRecords())) {
      this.#memberCache = undefined;
    }

    if (this.#memberCache) {
      return this.#memberCache;
    }

    const all = /** @type {HTMLElement[]} */ ([...this.parent.querySelectorAll(this.selector)]);

    const members = {
      all,
      active: all.filter((element) => !element.matches(INACTIVE_MEMBER_SELECTOR)),
    };

    // Until the observer is connected on activation, nothing would discard a cached list once the
    // members mount
    if (this.activated) {
      this.#memberCache = members;
    }

    return members;
  }

  /**
   * Check whether any of the given mutations adds, removes, disables or hides a member. The subtree
   * is observed as a whole, so most changes happen inside a member — a cell rendering its content,
   * an image arriving — and leave the member lists as they were. Recomputing the lists, and the
   * roving tab stop with them, on each of those would cost a query over every member of a widget
   * that can hold thousands.
   * @param {MutationRecord[]} records Mutations.
   * @returns {boolean} Whether the member lists may have changed.
   */
  #affectsMembers(records) {
    const { selector } = this;

    /**
     * Check whether the given node is a member or holds one.
     * @param {Node} node Node.
     * @returns {boolean} Result.
     */
    const hasMember = (node) =>
      node instanceof Element && (node.matches(selector) || !!node.querySelector(selector));

    return records.some(({ type, target, addedNodes, removedNodes }) =>
      type === 'attributes'
        ? target instanceof Element && target.matches(selector)
        : [...addedNodes].some(hasMember) || [...removedNodes].some(hasMember),
    );
  }

  /**
   * List of all the members.
   * @type {HTMLElement[]}
   */
  get allMembers() {
    return this.#members.all;
  }

  /**
   * List of the enabled and visible members.
   * @type {HTMLElement[]}
   */
  get activeMembers() {
    return this.#members.active;
  }

  /**
   * Get the currently selected member.
   * @type {HTMLElement | undefined}
   */
  get selected() {
    return this.activeMembers.find(
      (element) => element.getAttribute(this.childSelectedAttr) === 'true',
    );
  }

  /**
   * Whether the widget is a menu or a menubar.
   * @type {boolean}
   */
  get #isMenu() {
    return this.childRoles.includes('menuitem');
  }

  /**
   * Whether the widget is displayed in grid mode.
   * @type {boolean}
   */
  get grid() {
    return this.role === 'grid' || (this.role === 'listbox' && this.parent.matches('.grid'));
  }

  /**
   * Click a radio button, so its component checks itself and updates its bound group. The click
   * bubbles back up to the group, which must not take it as another selection.
   * @param {HTMLElement} element Radio button.
   */
  #clickRadio(element) {
    this.#clickingRadio = true;

    try {
      element.click();
    } finally {
      this.#clickingRadio = false;
    }
  }

  /**
   * Apply a selection made on the target to one of the members taking part in it: activate a plain
   * menu item, toggle a member of a multi-select group, or check or uncheck a member of a
   * single-select group.
   * @param {MouseEvent | KeyboardEvent} event Triggered event.
   * @param {HTMLElement} element Member element.
   * @param {object} context Selection context.
   * @param {string | null} context.role The member’s role.
   * @param {boolean} context.isTarget Whether the member is the target.
   * @param {boolean} context.targetSelectable Whether the target can hold a selected state.
   * @param {boolean} context.selecting Whether the event is a click or Space, which selects, rather
   * than a key that merely moves.
   * @returns {boolean} Whether the member’s selection changed, or an action was taken on it.
   */
  #applySelection(event, element, { role, isTarget, targetSelectable, selecting }) {
    const isMenuItemRadio = role === 'menuitemradio';
    const selectable = isSelectable(element, role);
    const multiSelect = selectable && (role === 'menuitemcheckbox' || this.multi);
    const singleSelect = selectable && targetSelectable && (isMenuItemRadio || !multiSelect);
    const isSelected = element.getAttribute(this.childSelectedAttr) === 'true';
    let changed = false;

    // A plain menu item is activated, never checked, and only by a click or Space: the arrow
    // keys merely move to it
    if (role === 'menuitem' && isTarget && selecting) {
      changed = true;
      element.dispatchEvent(new CustomEvent('Select'));
    }

    if (multiSelect && isTarget && selecting) {
      changed = true;
      this.setMemberSelected(element, this.childSelectedAttr, !isSelected);
    }

    if (singleSelect && isSelected !== isTarget && (isMenuItemRadio ? selecting : true)) {
      changed = true;
      this.setMemberSelected(element, this.childSelectedAttr, isTarget, () => {
        if (event.type === 'keydown' && role === 'radio') {
          this.#clickRadio(element);
        }
      });
    }

    return changed;
  }

  /**
   * Move the cursor onto the target, or off any other member taking part in a selection: the
   * focused state where the group itself holds focus, the panel the member controls, and the
   * group’s active descendant.
   * @param {HTMLElement} element Member element.
   * @param {boolean} isTarget Whether the member is the target.
   * @param {HTMLElement[]} scrollTargets Elements to be scrolled into view, which the target and
   * its panel are added to.
   */
  #moveCursor(element, isTarget, scrollTargets) {
    const controlTarget = this.#getControlTarget(element);

    if (controlTarget) {
      this.#setPanelShown(controlTarget, isTarget);

      if (isTarget) {
        scrollTargets.push(controlTarget);
      }
    }

    if (!isTarget) {
      return;
    }

    if (this.focusChild) {
      this.parent.setAttribute('aria-activedescendant', element.id);
    } else {
      setFocusedMember(this.parent, element);
      element.dispatchEvent(new CustomEvent('Focus'));
    }

    scrollTargets.push(element);
  }

  /**
   * Move the roving tab stop and the focus onto the target.
   * @param {HTMLElement} newTarget Target element.
   * @param {boolean} targetAffected Whether the target itself took part, meaning it’s the one to
   * receive focus.
   */
  #moveFocus(newTarget, targetAffected) {
    // Done right away rather than on the next frame: a key that repeats, or a second press before
    // the frame, has to start from the member that was just reached, which it reads from the focus
    this.setTabStop(targetAffected ? newTarget : undefined);

    if (targetAffected) {
      newTarget.focus();
      newTarget.dispatchEvent(new CustomEvent('Focus'));
    }
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
    // Moving to a member that can’t be selected, such as a plain menu item, leaves the selection
    // as it is, rather than clearing it as moving to another member of a single-select group does
    const targetSelectable = isSelectable(newTarget, targetRole);

    // A click or Space selects; the arrow keys and the like merely move
    const selecting =
      event.type === 'click' ||
      (event.type === 'keydown' && /** @type {KeyboardEvent} */ (event).key === ' ');

    /**
     * Whether the target itself took part, meaning it’s the one to receive focus.
     * @type {boolean}
     */
    let targetAffected = false;
    /**
     * Elements to be scrolled into view: the target and the panel it controls, if any.
     * @type {HTMLElement[]}
     */
    const scrollTargets = [];
    /**
     * Whether the selection changed, or an action was taken on a menu item, which is what the
     * group’s own `Change` event reports. Moving the cursor alone, or selecting the member that is
     * already selected, changes nothing.
     * @type {boolean}
     */
    let changed = false;

    this.activeMembers.forEach((element) => {
      // Reading the role once and comparing it is markedly cheaper than putting every member
      // through the selector engine three times over
      const role = element.getAttribute('role');

      if (
        (role === 'menuitemcheckbox' || role === 'menuitemradio') &&
        (role !== targetRole || element.closest(this.parentGroupSelector) !== targetParent)
      ) {
        return;
      }

      const isTarget = element === newTarget;

      targetAffected ||= isTarget;

      if (this.#applySelection(event, element, { role, isTarget, targetSelectable, selecting })) {
        changed = true;
      }

      this.#moveCursor(element, isTarget, scrollTargets);
    });

    if (scrollTargets.length) {
      this.scrollIntoViewLater(scrollTargets);
    }

    if (this.focusChild) {
      this.#moveFocus(newTarget, targetAffected);
    }

    if (changed) {
      this.dispatchChange(newTarget);
    }
  }

  /**
   * Scroll the given elements into view after a short delay, replacing any pending scroll, so a
   * key held down doesn’t queue a scroll for every member it passes and jump back to an old one.
   * @param {HTMLElement[]} elements Elements to scroll into view.
   */
  scrollIntoViewLater(elements) {
    globalThis.clearTimeout(this.#scrollTimer);

    this.#scrollTimer = globalThis.setTimeout(() => {
      this.#scrollTimer = undefined;

      elements.forEach(scrollIntoViewIfNeeded);
    }, 300);
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

    if (!newTarget || event.button !== 0 || !this.clickToSelect || this.#clickingRadio) {
      return;
    }

    this.selectTarget(event, newTarget);

    // Where the group itself holds focus, as a listbox does, a click still lands it on the member
    // clicked. Take it back, so the keys keep moving the cursor from the group and the focus ring
    // follows the cursor rather than staying on the clicked member. A pointer-driven focus doesn’t
    // match `:focus-visible`, so no ring appears on the click itself.
    if (
      !this.focusChild &&
      document.activeElement !== this.parent &&
      newTarget.contains(document.activeElement)
    ) {
      this.parent.focus({ preventScroll: true });
    }
  }

  /**
   * Handle the `keydown` event on the widget.
   * @param {KeyboardEvent} event `keydown` event.
   */
  onKeyDown(event) {
    const { key } = event;
    // eslint-disable-next-line prefer-destructuring
    const target = /** @type {HTMLElement} */ (event.target);

    // A field the user is typing in keeps its keys: the caret moves, the text changes. Escape and
    // Tab still reach the group, so a menu holding a field can be left the usual ways.
    if (
      target !== this.parent &&
      target.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])') &&
      key !== 'Escape' &&
      key !== 'Tab'
    ) {
      return;
    }

    const currentTarget = this.#getCurrentTarget(target);

    if (this.#isMenu && handleMenuKey(this, event, currentTarget)) {
      return;
    }

    if (hasModifier(event)) {
      return;
    }

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

    const newTarget = this.#getKeyTarget(event, currentTarget);

    if (newTarget && newTarget !== currentTarget) {
      this.selectTarget(event, newTarget);
    }
  }

  /**
   * Get the member a key press moves to: either end of the group for Home and End, the next match
   * for type-ahead, or the neighbor in the arrow’s direction.
   * @param {KeyboardEvent} event `keydown` event.
   * @param {HTMLElement | undefined} currentTarget Current member, if any.
   * @returns {HTMLElement | undefined} Member to move to, if any.
   */
  #getKeyTarget(event, currentTarget) {
    const { key } = event;
    const { activeMembers } = this;
    // eslint-disable-next-line prefer-destructuring
    const target = /** @type {HTMLElement} */ (event.target);
    // Home, End and type-ahead only apply to keystrokes on the group itself or on a member. A text
    // field nested in a menu, say, keeps them for its own caret and content.
    const fromMember = target === this.parent || target.matches(this.selector);

    // Home and End jump to the ends of the group, in any layout
    if (key === 'Home' || key === 'End') {
      if (!fromMember) {
        return undefined;
      }

      event.preventDefault();

      return activeMembers[key === 'Home' ? 0 : activeMembers.length - 1];
    }

    // Type-ahead: a printable character moves to the next member whose label starts with what has
    // been typed so far, as in a native `<select>` and per the Listbox and Menu patterns. This goes
    // by the visible label, not the search value, which may hold synonyms for filtering — and by
    // the label element rather than the whole text, which would take in icon ligature names.
    if (isPrintableKey(event) && fromMember && (this.role === 'listbox' || this.#isMenu)) {
      // Swallow the key whether or not it matches, as a native `<select>` does. Left to the
      // browser, a printable key on a non-editable element starts Firefox’s find-as-you-type.
      event.preventDefault();

      return this.findTypeAheadMatch(activeMembers, key, currentTarget, (member) =>
        getItemLabel(member),
      );
    }

    return this.#getArrowTarget(key, currentTarget, isRTL());
  }

  /**
   * Get the member a key press moves from: the member with the cursor where the group itself holds
   * focus, otherwise the member the key was pressed on.
   * @param {HTMLElement} target Element the key was pressed on.
   * @returns {HTMLElement | undefined} Current member, if any.
   */
  #getCurrentTarget(target) {
    if (!this.focusChild) {
      return this.activeMembers.find((member) => member.matches('.focused'));
    }

    // A key pressed on a control inside a member, such as a checkbox in a grid row, moves from
    // that member
    const member = /** @type {HTMLElement | null} */ (target.closest(this.selector));

    return member && this.parent.contains(member) ? member : undefined;
  }

  /**
   * Get the member an arrow key moves to.
   * @param {string} key Pressed key.
   * @param {HTMLElement | undefined} currentTarget Current member, if any.
   * @param {boolean} rtl Whether the layout runs right to left.
   * @returns {HTMLElement | undefined} Member to move to, if any.
   */
  #getArrowTarget(key, currentTarget, rtl) {
    const { allMembers, activeMembers } = this;

    if (!this.grid) {
      const index = currentTarget ? activeMembers.indexOf(currentTarget) : -1;
      const count = activeMembers.length;

      // A radio group moves with all four arrows whatever its orientation, as native radio buttons
      // do and as the Radio Group pattern expects: Down and Right go to the next radio, Up and Left
      // to the previous one, with the inline arrows mirrored for RTL.
      if (this.role === 'radiogroup') {
        const inlineIndex = getLinearTargetIndex({
          key,
          index,
          count,
          ...getArrowKeys('horizontal', rtl),
        });

        return activeMembers[
          inlineIndex === -1
            ? getLinearTargetIndex({ key, index, count, ...getArrowKeys('vertical', rtl) })
            : inlineIndex
        ];
      }

      const keys = getArrowKeys(this.orientation, rtl);

      return activeMembers[getLinearTargetIndex({ key, index, count, ...keys })];
    }

    const { columnCount } = this;
    // Members filtered out by a search take no cell in the layout, so they’re left out of the index
    // the same way they’re left out of the column count. A disabled member still takes its cell,
    // and stays in.
    const members = allMembers.filter((member) => member.getAttribute('aria-hidden') !== 'true');
    const index = currentTarget ? members.indexOf(currentTarget) : -1;
    // With nothing focused yet, the arrows start from either end of the active members
    const list = index === -1 ? activeMembers : members;
    const keys = getArrowKeys('horizontal', rtl);
    let targetIndex = index;
    /** @type {HTMLElement | undefined} */
    let newTarget;

    // Step over a disabled member in the same direction: the inline arrows on to the next member,
    // the vertical arrows on to the next row in the same column. Each step moves further along or
    // returns `-1`, so this ends at the edge of the grid at the latest.
    do {
      targetIndex = getGridTargetIndex({
        key,
        index: targetIndex,
        count: list.length,
        columnCount,
        ...keys,
      });
      newTarget = list[targetIndex];
    } while (newTarget && isDisabled(newTarget));

    return newTarget;
  }

  /**
   * Clean up event listeners and observers.
   * @override
   */
  destroy() {
    super.destroy();
    globalThis.clearTimeout(this.#scrollTimer);
    this.observer.disconnect();
    this.selectionObserver?.disconnect();
  }

  /**
   * Called whenever the params are updated. Apply `clickToSelect` if given, and filter the items
   * based on the search terms if given.
   * @override
   * @param {object} params Updated params.
   * @param {string} [params.searchTerms] Search terms.
   * @param {boolean} [params.clickToSelect] Whether to select an item by clicking on it.
   */
  onUpdate(params) {
    const { searchTerms } = params;

    if ('clickToSelect' in params) {
      this.clickToSelect = params.clickToSelect ?? true;
    }

    // Only a filterable widget, such as a listbox, passes search terms
    if (typeof searchTerms !== 'string') {
      return;
    }

    const terms = normalize(searchTerms);
    const _terms = terms ? terms.split(/\s+/) : [];
    const { allMembers, parent } = this;

    const matched = allMembers
      .map((member) => {
        const searchValue = this.#getNormalizedSearchValue(member);
        const hidden = !_terms.every((term) => searchValue.includes(term));

        // Only report an actual change. Every keystroke runs this over every member, and the
        // listener on the other end drives a component update
        if (this.#hiddenState.get(member) !== hidden) {
          this.#hiddenState.set(member, hidden);
          member.dispatchEvent(new CustomEvent('Toggle', { detail: { hidden } }));
        }

        return hidden;
      })
      .filter((hidden) => !hidden).length;

    parent.dispatchEvent(
      new CustomEvent('Filter', { detail: { matched, total: allMembers.length } }),
    );
  }
}

/**
 * Activate a new group. Takes a params object, or a getter function for reactive params, and
 * returns an attachment.
 */
export const activateGroup = createWidgetAttachment(Group);
