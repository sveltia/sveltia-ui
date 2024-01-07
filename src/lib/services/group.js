import { getRandomId, sleep } from './util';

/**
 * @type {{ [role: string]: {
 * orientation: 'vertical' | 'horizontal',
 * childRoles: string[],
 * childSelectedAttr: 'aria-selected' | 'aria-checked',
 * focusChild: boolean
 * } }}
 */
const config = {
  grid: {
    orientation: 'vertical',
    childRoles: ['row'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
  },
  listbox: {
    orientation: 'vertical',
    childRoles: ['option'],
    childSelectedAttr: 'aria-selected',
    focusChild: false,
  },
  menu: {
    orientation: 'vertical',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
  },
  menubar: {
    orientation: 'horizontal',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
  },
  radiogroup: {
    orientation: 'horizontal',
    childRoles: ['radio'],
    childSelectedAttr: 'aria-checked',
    focusChild: true,
  },
  tablist: {
    orientation: 'horizontal',
    childRoles: ['tab'],
    childSelectedAttr: 'aria-selected',
    focusChild: true,
  },
};

/**
 * Implement keyboard and mouse interactions for a grouping composite widget.
 */
class Group {
  /**
   * Initialize a new `Group` instance.
   * @param {HTMLElement} parent - Parent element.
   * @todo Check for added elements probably with `MutationObserver`.
   */
  constructor(parent) {
    parent.dispatchEvent(new CustomEvent('initializing'));

    this.parent = parent;
    this.role = /** @type {string} */ (parent.getAttribute('role'));
    this.grid = this.role === 'listbox' && parent.matches('.grid');
    this.multi = this.parent.getAttribute('aria-multiselectable') === 'true';
    this.id = getRandomId(this.role);
    this.parentGroupSelector = `[role="group"], [role="${this.role}"]`;

    const { orientation, childRoles, childSelectedAttr, focusChild } = config[this.role];

    this.orientation = this.grid
      ? 'horizontal'
      : this.parent.getAttribute('aria-orientation') ?? orientation;
    this.childRoles = childRoles;
    this.childSelectedAttr = childSelectedAttr;
    this.childSelectedProp = childSelectedAttr.replace('aria-', '');
    this.focusChild = focusChild;

    const { allMembers, selected: defaultSelected } = this;

    allMembers.forEach((element, index) => {
      // Select the first one if no member has the `selected` attribute
      const isSelected = defaultSelected ? element === defaultSelected : index === 0;

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
          controlTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
        }
      }
    });

    parent.addEventListener('click', (event) => {
      if (/** @type {HTMLElement} */ (event.target).matches(this.selector)) {
        this.onClick(event);
      }
    });

    parent.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });

    parent.dispatchEvent(new CustomEvent('initialized'));
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
          new CustomEvent('change', { detail: { [this.childSelectedProp]: !isSelected } }),
        );

        if (!isSelected) {
          element.dispatchEvent(new CustomEvent('select'));
        }
      }

      if (
        singleSelect &&
        isSelected !== isTarget &&
        (isMenuItemRadio ? selectByKeydown || selectByClick : true)
      ) {
        element.setAttribute(this.childSelectedAttr, String(isTarget));
        element.dispatchEvent(
          new CustomEvent('change', { detail: { [this.childSelectedProp]: isTarget } }),
        );

        if (isTarget) {
          element.dispatchEvent(new CustomEvent('select'));
        }
      }

      if (this.focusChild) {
        element.tabIndex = isTarget ? 0 : -1;

        if (isTarget) {
          element.focus();
        }
      } else {
        element.classList.toggle('focused', isTarget);
      }

      if (controlTarget) {
        controlTarget.inert = !isTarget;
        controlTarget.setAttribute('aria-hidden', String(!isTarget));

        if (isTarget) {
          controlTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
        }
      }

      if (isTarget) {
        this.parent.setAttribute('aria-activedescendant', element.id);
        element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    });

    this.parent.dispatchEvent(
      new CustomEvent('change', {
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
    const newTarget = target.matches(this.selector) ? target : undefined;

    if (!newTarget || event.button !== 0) {
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

    const currentTarget = (() => {
      if (!this.focusChild) {
        return activeMembers.find((member) => member.matches('.focused')) ?? activeMembers[0];
      }

      if (target.matches(this.selector)) {
        return target;
      }

      return undefined;
    })();

    if (!currentTarget) {
      return;
    }

    if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
    }

    if (key === 'Enter') {
      currentTarget.click(); // Also close the popup if needed

      return;
    }

    if (key === ' ') {
      this.selectTarget(event, currentTarget);

      return;
    }

    let index;
    let newTarget;

    if (this.grid) {
      const colCount = Math.floor(this.parent.clientWidth / currentTarget.clientWidth);

      index = allMembers.indexOf(currentTarget);

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
      index = activeMembers.indexOf(currentTarget);

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
}

/**
 * Activate a new group.
 * @param {HTMLElement} parent - Parent element.
 */
export const activateGroup = (parent) => {
  (async () => {
    // Wait a bit before the relevant components, including the `aria-controls` target are mounted
    await sleep(100);

    return new Group(parent);
  })();
};
