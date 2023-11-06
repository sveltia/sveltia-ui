import { getRandomId, sleep } from './util';

/**
 * @type {{ [role: string]: {
 *   orientation: string,
 *   childRoles: string[],
 *   childSelectedAttr: string,
 *   focusChild: boolean
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
   * @param {HTMLElement} parent Parent element.
   * @todo Check for added elements probably with `MutationObserver`.
   */
  constructor(parent) {
    this.parent = parent;
    this.role = parent.getAttribute('role');
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
    this.focusChild = focusChild;

    const { allMembers } = this;

    const hasSelected = allMembers.some((element) =>
      element.matches(`[${childSelectedAttr}="true"]`),
    );

    allMembers.forEach((element, index) => {
      const isSelected = element.matches(`[${childSelectedAttr}="true"]`);
      const controls = document.querySelector(`#${element.getAttribute('aria-controls')}`);

      element.id ||= `${this.id}-item-${index}`;
      element.tabIndex ||= isSelected || (!hasSelected && index === 0) ? 0 : -1;
      element.setAttribute(this.childSelectedAttr, String(isSelected));
      controls?.setAttribute('aria-labelledby', element.id);
      controls?.setAttribute('aria-hidden', String(!isSelected));
    });

    parent.addEventListener('click', (event) => {
      if (/** @type {HTMLElement} */ (event.target).matches(this.selector)) {
        this.onClick(event);
      }
    });

    parent.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });
  }

  /** @type {string} */
  get selector() {
    return this.childRoles.map((role) => `[role="${role}"]`).join(',');
  }

  /** @type {HTMLElement[]} */
  get allMembers() {
    return /** @type {HTMLElement[]} */ ([...this.parent.querySelectorAll(this.selector)]);
  }

  /** @type {HTMLElement[]} */
  get activeMembers() {
    return this.allMembers.filter(
      (element) => !element.matches('[aria-disabled="true"], [aria-hidden="true"]'),
    );
  }

  /**
   * Select (and move focus to) the given target.
   * @param {(MouseEvent | KeyboardEvent)} event Triggered event.
   * @param {HTMLElement} newTarget Target element.
   */
  selectTarget(event, newTarget) {
    const targetParentGroup = newTarget.closest(this.parentGroupSelector);

    this.activeMembers.forEach((element) => {
      const isTarget = element === newTarget;
      const isSelected = element.matches('[aria-selected="true"]');
      const isMenuItemRadio = element.matches('[role="menuitemradio"]');
      const controls = element.getAttribute('aria-controls');

      if (this.multi && isTarget && event.type === 'click') {
        element.setAttribute(this.childSelectedAttr, String(!isSelected));
        element.dispatchEvent(new CustomEvent(isSelected ? 'unselect' : 'select'));
      }

      if (
        (isMenuItemRadio && element.closest(this.parentGroupSelector) === targetParentGroup) ||
        (!isMenuItemRadio && !this.multi)
      ) {
        element.setAttribute(this.childSelectedAttr, String(isTarget));
        element.dispatchEvent(new CustomEvent(isTarget ? 'select' : 'unselect'));
      }

      if (this.focusChild) {
        element.tabIndex = isTarget ? 0 : -1;

        if (isTarget) {
          element.focus();
        }
      } else {
        element.classList.toggle('focused', isTarget);
      }

      if (controls) {
        document.getElementById(controls)?.setAttribute('aria-hidden', String(!isTarget));
      }

      if (isTarget) {
        element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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
   * @param {MouseEvent} event `click` event.
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
   * @param {KeyboardEvent} event `keydown` event.
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

    if (['Enter', ' '].includes(key)) {
      currentTarget.click();

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
 * @param {HTMLElement} parent Parent element.
 */
export const activateGroup = (parent) => {
  (async () => {
    // Wait a bit before the relevant components, including the `aria-controls` target are mounted
    await sleep(100);

    return new Group(parent);
  })();
};
