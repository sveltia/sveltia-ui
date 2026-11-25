/**
 * Base class shared by the composite widgets, `Group` and `Tree`, along with the attachment factory
 * that mounts them.
 */

import { sleep } from '@sveltia/utils/misc';
import { untrack } from 'svelte';
import { isDisabled, isReadOnly } from './navigation.js';
import { TypeAhead } from './type-ahead.js';
import { getSelectedItemDetail } from './value.js';

/**
 * @import { Attachment } from 'svelte/attachments';
 */

/**
 * Lifecycle shared by the composite widgets: the `Initializing` and `Initialized` events, the
 * delayed activation that gives the child components time to mount, the event listeners that
 * activate the widget before handling an event that comes first, and the clean-up. Also the member
 * handling both widgets have in common: the roving tab stop, type-ahead and the selected state.
 */
export class CompositeWidget {
  /**
   * Whether {@link activate} has run. Until then, members are left as they are rendered.
   * @type {boolean}
   */
  activated = false;

  /**
   * Whether {@link destroy} has run, so a pending {@link activate} must not run.
   * @type {boolean}
   */
  destroyed = false;

  /**
   * Keystroke buffer for type-ahead.
   * @type {TypeAhead}
   */
  typeAheadBuffer = new TypeAhead();

  /**
   * Controller whose signal removes every listener added with {@link listen} once aborted.
   * @type {AbortController}
   */
  #controller = new AbortController();

  /**
   * Initialize a new `CompositeWidget` instance, and schedule its activation.
   * @param {HTMLElement} parent Widget root element.
   */
  constructor(parent) {
    parent.dispatchEvent(new CustomEvent('Initializing'));

    this.parent = parent;

    this.#activateLater();
  }

  /**
   * Activate the widget after a short delay, giving the relevant components, including the
   * `aria-controls` targets, time to mount — unless the widget has been unmounted in the meantime,
   * in which case nothing is set up.
   */
  async #activateLater() {
    await sleep(100);

    if (!this.destroyed) {
      this.activate();
    }
  }

  /**
   * Listen to an event on the widget root until {@link destroy} is called. The widget is activated
   * before the event is handled, so an event that comes before the delayed activation isn’t lost.
   * @template {keyof HTMLElementEventMap} K
   * @param {K} type Event type.
   * @param {(event: HTMLElementEventMap[K]) => void} handler Event handler.
   */
  listen(type, handler) {
    this.parent.addEventListener(
      type,
      (event) => {
        this.activate();
        handler(event);
      },
      { signal: this.#controller.signal },
    );
  }

  /**
   * Activate the members, unless they already are.
   */
  activate() {
    if (this.activated) {
      return;
    }

    this.activated = true;
    this.setUp();
    this.parent.dispatchEvent(new CustomEvent('Initialized'));
  }

  /**
   * Set up the members on activation. To be implemented by the subclass.
   */
  setUp() {}

  /**
   * Called whenever the params passed to the attachment are updated. To be implemented by the
   * subclass.
   * @param {Record<string, any>} _params Updated params.
   */
  // eslint-disable-next-line no-unused-vars
  onUpdate(_params) {}

  /**
   * CSS selector to retrieve the members. To be implemented by the subclass.
   * @type {string}
   */
  get selector() {
    return '';
  }

  /**
   * Pick the member to hold the widget’s single tab stop. The stop stays where the user is: the
   * focused member, or else the one member already holding it. Only when there is no single stop —
   * at activation, where every member may render as one, or after new members have — is one
   * picked: the selected member, or else the first one not marked as unselectable, so a grid’s
   * header row or a row group caption isn’t where the user lands when they tab into it.
   * @param {HTMLElement[]} members Enabled and visible members.
   * @param {() => HTMLElement | undefined} [getSelected] Function that returns the selected member,
   * if the selection decides the stop.
   * @returns {HTMLElement | undefined} Member to hold the tab stop, if any.
   */
  pickTabStop(members, getSelected) {
    const focused = document.activeElement?.closest(this.selector);

    if (focused && members.includes(/** @type {HTMLElement} */ (focused))) {
      return /** @type {HTMLElement} */ (focused);
    }

    const holders = members.filter((member) => member.getAttribute('tabindex') === '0');

    if (holders.length === 1) {
      return holders[0];
    }

    return (
      getSelected?.() ??
      // A plain menu item can’t be selected either, but it’s still where a menu starts
      members.find((member) => member.dataset.selectable !== 'false') ??
      members[0]
    );
  }

  /**
   * Put exactly one member in the tab sequence, as a composite widget should. Only the members
   * actually in it are touched: writing a `tabindex` to every member costs a pass over the whole
   * widget on each arrow key, and all but one of those writes set the value it already had. A
   * member without the attribute counts as being in it, since a `<button>` is focusable as is. The
   * attribute is what’s compared, rather than the `tabIndex` property, for the same reason.
   * @param {HTMLElement} [member] Member to become the tab stop. When omitted, no member is left in
   * the tab sequence, which is the case for a widget with nothing to focus.
   */
  setTabStop(member) {
    this.parent
      .querySelectorAll(`:is(${this.selector}):not([tabindex="-1"])`)
      .forEach((element) => {
        if (element !== member) {
          /** @type {HTMLElement} */ (element).tabIndex = -1;
        }
      });

    if (member && member.getAttribute('tabindex') !== '0') {
      member.tabIndex = 0;
    }
  }

  /**
   * Find the next member whose label starts with what has been typed so far, including the given
   * key. Typing the same character repeatedly cycles through the members starting with it.
   * @param {HTMLElement[]} members Enabled and visible members, in order.
   * @param {string} key Printable key.
   * @param {HTMLElement | undefined} currentMember Current member, if any.
   * @param {(member: HTMLElement) => string} getLabel Function that returns a member’s label.
   * @returns {HTMLElement | undefined} Matching member, if any.
   */
  findTypeAheadMatch(members, key, currentMember, getLabel) {
    const index = this.typeAheadBuffer.match(
      members.map((member) => getLabel(member)),
      key,
      currentMember ? members.indexOf(currentMember) : -1,
    );

    return index === -1 ? undefined : members[index];
  }

  /**
   * Set a member’s selected state and tell its component about it: a `Change` event with the new
   * state, then a `Select` event if the member has been selected.
   * @param {HTMLElement} member Member element.
   * @param {'aria-selected' | 'aria-checked'} attribute Attribute that holds the selected state.
   * The `Change` event detail carries the state under the same name, without the `aria-` prefix.
   * @param {boolean} selected Whether the member is selected.
   * @param {() => void} [beforeSelect] Function to call between the two events, if the member has
   * been selected.
   */
  setMemberSelected(member, attribute, selected, beforeSelect) {
    member.setAttribute(attribute, String(selected));
    member.dispatchEvent(
      new CustomEvent('Change', { detail: { [attribute.replace('aria-', '')]: selected } }),
    );

    if (selected) {
      beforeSelect?.();
      member.dispatchEvent(new CustomEvent('Select'));
    }
  }

  /**
   * Whether the widget is disabled.
   * @type {boolean}
   */
  get isDisabled() {
    return isDisabled(this.parent);
  }

  /**
   * Whether the widget is read-only.
   * @type {boolean}
   */
  get isReadOnly() {
    return isReadOnly(this.parent);
  }

  /**
   * Notify a change of the selection on the widget root.
   * @param {HTMLElement} item Member that triggered the change.
   */
  dispatchChange(item) {
    this.parent.dispatchEvent(new CustomEvent('Change', { detail: getSelectedItemDetail(item) }));
  }

  /**
   * Clean up event listeners.
   */
  destroy() {
    this.destroyed = true;
    this.#controller.abort();
    this.typeAheadBuffer.reset();
  }
}

/**
 * Create an attachment factory for the given composite widget class.
 * @template {CompositeWidget} W
 * @param {new (parent: HTMLElement, params?: any) => W} Widget Widget class.
 * @returns {(paramsOrGetter?: object | (() => object)) => Attachment} Function that takes a params
 * object, or a getter function for reactive params, and returns an attachment.
 */
export const createWidgetAttachment = (Widget) => (paramsOrGetter) => (parent) => {
  const isGetter = typeof paramsOrGetter === 'function';
  // Read the params without tracking them: attachments run in an effect, so a tracked read would
  // destroy and recreate the whole widget whenever they change, e.g. on every search keystroke.
  // Changes are handled by `onUpdate()` below instead.
  const initialParams = isGetter ? untrack(() => paramsOrGetter()) : paramsOrGetter;
  const widget = new Widget(/** @type {HTMLElement} */ (parent), initialParams);

  /* v8 ignore next 4 */
  if (isGetter) {
    $effect(() => {
      widget.onUpdate(paramsOrGetter());
    });
  }

  return () => {
    widget.destroy();
  };
};
