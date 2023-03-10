/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */

import { sleep } from '../util/misc';
import { getRandomId } from './util';

const config = {
  grid: {
    orientation: 'vertical',
    childRoles: ['row'],
    childSelectedAttr: 'aria-selected',
  },
  listbox: {
    orientation: 'vertical',
    childRoles: ['option'],
    childSelectedAttr: 'aria-selected',
  },
  menu: {
    orientation: 'vertical',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
  },
  menubar: {
    orientation: 'horizontal',
    childRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    childSelectedAttr: 'aria-checked',
  },
  radiogroup: {
    orientation: 'horizontal',
    childRoles: ['radio'],
    childSelectedAttr: 'aria-checked',
  },
  tablist: {
    orientation: 'horizontal',
    childRoles: ['tab'],
    childSelectedAttr: 'aria-selected',
  },
};

/**
 * Implement keyboard and mouse interactions for a grouping composite widget.
 */
class Group {
  /**
   *
   * @param {HTMLElement} parent
   * @todo Check for added elements probably with `MutationObserver`.
   */
  constructor(parent) {
    this.parent = parent;
    this.role = parent.getAttribute('role');
    this.grid = this.role === 'listbox' && parent.matches('.grid');
    this.multi = this.parent.getAttribute('aria-multiselectable') === 'true';
    this.id = getRandomId(this.role);
    this.parentGroupSelector = `[role="group"], [role="${this.role}"]`;

    const { orientation, childSelectedAttr } = config[this.role];

    this.orientation = this.grid
      ? 'horizontal'
      : this.parent.getAttribute('aria-orientation') || orientation;
    this.childSelectedAttr = childSelectedAttr;

    const { allMembers } = this;

    const hasSelected = allMembers.some((element) =>
      element.matches(`[${childSelectedAttr}="true"]`),
    );

    allMembers.forEach((element, index) => {
      const isSelected = element.matches(`[${childSelectedAttr}="true"]`);
      const controls = document.querySelector(`#${element.getAttribute('aria-controls')}`);

      element.id ||= `${this.id}-item-${index}`;
      element.tabIndex ||= isSelected || (!hasSelected && index === 0) ? 0 : -1;
      element.setAttribute(this.childSelectedAttr, isSelected);
      controls?.setAttribute('aria-labelledby', element.id);
      controls?.setAttribute('aria-hidden', !isSelected);
    });

    parent.addEventListener('click', (event) => {
      this.onClick(event);
    });

    parent.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });
  }

  /** @type {string} */
  get selector() {
    const roles = config[this.role].childRoles;

    return roles ? roles.map((role) => `[role="${role}"]`).join(',') : '';
  }

  /** @type {HTMLElement[]} */
  get allMembers() {
    return [...this.parent.querySelectorAll(this.selector)];
  }

  /** @type {HTMLElement[]} */
  get activeMembers() {
    return this.allMembers.filter((element) => !element.matches('[aria-disabled="true"]'));
  }

  /**
   *
   * @param {KeyboardEvent}
   */
  onClick(event) {
    const { target } = event;

    if (!target.matches(this.selector)) {
      return;
    }

    const targetParentGroup = target.closest(this.parentGroupSelector);

    this.allMembers.forEach((element) => {
      const isTarget = element === target;

      element.tabIndex = element === target ? 0 : -1;

      // Groups can be nested, e.g. `menu` > `group` > `menuitem`, so check if the parent is the
      // same as the target???s parent
      if (
        (element.matches('[role="radio"], [role="menuitemradio"]') ||
          (element.matches('[role="row"], [role="option"], [role="tab"]') && !this.multi)) &&
        element.closest(this.parentGroupSelector) === targetParentGroup
      ) {
        element.setAttribute(this.childSelectedAttr, isTarget);
      }

      const controls = element.getAttribute('aria-controls');

      if (controls) {
        document.getElementById(controls)?.setAttribute('aria-hidden', !isTarget);
      }
    });

    this.parent.dispatchEvent(
      new CustomEvent('select', {
        detail: {
          value: target.value,
          name: target.name,
        },
      }),
    );
  }

  /**
   *
   * @param {KeyboardEvent}
   */
  onKeyDown(event) {
    const { target, key, ctrlKey, metaKey, shiftKey, altKey } = event;

    if (target.matches(this.selector) && !ctrlKey && !metaKey && !shiftKey && !altKey) {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
      }

      if (key === ' ' || (key === 'Enter' && !target.matches('button'))) {
        event.preventDefault();
        target.click();

        return;
      }

      const { allMembers, activeMembers } = this;
      let index;
      let newTarget;

      if (this.grid) {
        const colCount = Math.floor(this.parent.clientWidth / target.clientWidth);

        index = allMembers.indexOf(target);

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

        if (newTarget?.getAttribute('aria-disabled') === 'true') {
          newTarget = undefined;
        }
      } else {
        index = activeMembers.indexOf(target);

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

      if (newTarget && newTarget !== target) {
        activeMembers.forEach((element) => {
          element.tabIndex = element === newTarget ? 0 : -1;
        });

        newTarget.focus();
      }
    }
  }
}

/**
 *
 */
export const activateGroup = async (...args) => {
  // Wait a bit before the relevant components, including the `aria-controls` target are mounted
  await sleep(100);

  return new Group(...args);
};
