import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';

/**
 * @type {{ [role: string]: {
 * orientation: 'vertical' | 'horizontal',
 * childRoles: string[],
 * childSelectedAttr: 'aria-selected' | 'aria-checked',
 * focusChild: boolean
 * selectFirst: boolean
 * } }}
 */
const config = {
  grid: {
    orientation: 'vertical',
    childRoles: ['row'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
    selectFirst: false,
  },
  listbox: {
    orientation: 'vertical',
    childRoles: ['option'],
    childSelectedAttr: 'aria-selected',
    focusChild: false,
    selectFirst: false,
  },
  menu: {
    orientation: 'vertical',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
  },
  menubar: {
    orientation: 'horizontal',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
  },
  radiogroup: {
    orientation: 'horizontal',
    childRoles: ['radio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
    selectFirst: false,
  },
  tablist: {
    orientation: 'horizontal',
    childRoles: ['tab'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
    selectFirst: true,
  },
};

/**
 * Implement keyboard and mouse interactions for a grouping composite widget.
 */
class Group {
  /**
   * Initialize a new `Group` instance.
   * @param {HTMLElement} parent - Parent element.
   * @param {object} [options] - Options.
   * @param {boolean} [options.clickToSelect] - Whether to select an item by clicking on it.
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

    const { orientation, childRoles, childSelectedAttr, focusChild, selectFirst } =
      config[this.role];

    this.orientation = this.grid
      ? 'horizontal'
      : (this.parent.getAttribute('aria-orientation') ?? orientation);
    this.childRoles = childRoles;
    this.childSelectedAttr = childSelectedAttr;
    this.childSelectedProp = childSelectedAttr.replace('aria-', '');
    this.focusChild = focusChild;
    this.selectFirst = selectFirst;

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
    const { parent, role, allMembers, selected: defaultSelected } = this;
    const multi = this.multi || role === 'menu' || role === 'menubar';

    allMembers.forEach((element, index) => {
      // Select the first one if no member has the `selected` attribute
      // eslint-disable-next-line no-nested-ternary
      const isSelected = multi
        ? element.getAttribute(this.childSelectedAttr) === 'true'
        : defaultSelected
          ? element === defaultSelected
          : this.selectFirst && index === 0;

      const controlTarget = /** @type {HTMLElement | null} */ (
        document.querySelector(`#${element.getAttribute('aria-controls')}`)
      );

      element.id ||= `${this.id}-item-${index + 1}`;
      element.tabIndex ||= isSelected ? 0 : -1;
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

    parent.addEventListener('click', (event) => {
      this.onClick(event);
    });

    parent.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });

    parent.dispatchEvent(new CustomEvent('Initialized'));
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
   * @param {(MouseEvent | KeyboardEvent)} event - Triggered event.
   * @param {HTMLElement} newTarget - Target element.
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
      const controlTargetId = element.getAttribute('aria-controls');
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
      new CustomEvent('Change', {
        detail: {
          value: /** @type {any} */ (newTarget).value,
          name: /** @type {any} */ (newTarget).name,
        },
      }),
    );
  }

  /**
   * Handle the `click` event on the widget.
   * @param {MouseEvent} event - `click` event.
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
   * @param {KeyboardEvent} event - `keydown` event.
   */
  onKeyDown(event) {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

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

    let index;
    let newTarget;

    if (this.grid) {
      const colCount = Math.floor(this.parent.clientWidth / activeMembers[0].clientWidth);

      index = currentTarget ? allMembers.indexOf(currentTarget) : -1;

      if (key === 'ArrowUp' && index > 0) {
        newTarget = allMembers[index - colCount];
      }

      if (key === 'ArrowDown' && index < allMembers.length - 1) {
        newTarget = allMembers[index + colCount];
      }

      if (key === 'ArrowLeft' && index > 0) {
        newTarget = allMembers[index - 1];
      }

      if (key === 'ArrowRight' && index < allMembers.length - 1) {
        newTarget = allMembers[index + 1];
      }

      if (newTarget?.matches('[aria-disabled="true"], [aria-hidden="true"]')) {
        newTarget = undefined;
      }
    } else {
      index = currentTarget ? activeMembers.indexOf(currentTarget) : -1;

      if (key === (this.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp')) {
        if (index > 0) {
          // Previous member
          newTarget = activeMembers[index - 1];
        }

        if (index === 0) {
          // Last member
          newTarget = activeMembers[activeMembers.length - 1];
        }
      }

      if (key === (this.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown')) {
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
   * Called whenever the params are updated. Filter the items based on the search terms.
   * @param {{ searchTerms: string }} params - Updated params.
   */
  onUpdate({ searchTerms }) {
    const terms = searchTerms.trim().toLocaleLowerCase();
    const _terms = terms ? terms.split(/\s+/) : [];

    const matched = this.allMembers
      .map((member) => {
        const searchValue =
          (
            member.dataset.searchValue ??
            member.dataset.label ??
            member.querySelector('.label')?.textContent ??
            member.textContent
          )?.toLocaleLowerCase() ?? '';

        const hidden = !_terms.every((term) => searchValue.includes(term));

        member.dispatchEvent(new CustomEvent('Toggle', { detail: { hidden } }));

        return hidden;
      })
      .filter((hidden) => !hidden).length;

    this.parent.dispatchEvent(
      new CustomEvent('Filter', { detail: { matched, total: this.allMembers.length } }),
    );
  }
}

/**
 * Activate a new group.
 * @param {HTMLElement} parent - Parent element.
 * @param {object} [params] - Action params.
 * @returns {import('svelte/action').ActionReturn} Action.
 */
export const activateGroup = (parent, params) => {
  const group = new Group(parent, params);

  return {
    /**
     * Called whenever the params are updated.
     * @param {any} newParams - Updated params.
     */
    update(newParams) {
      group.onUpdate(newParams);
    },
  };
};
