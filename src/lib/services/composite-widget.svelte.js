/**
 * Base class shared by the composite widgets, `Group` and `Tree`, along with the attachment factory
 * that mounts them.
 */

import { untrack } from 'svelte';
import { getSelectedItemDetail } from './select.svelte.js';
import { TypeAhead } from './type-ahead.js';
import { activateBefore, activateLater } from './widget.js';

/**
 * @import { Attachment } from 'svelte/attachments';
 */

/**
 * Lifecycle shared by the composite widgets: the `Initializing` and `Initialized` events, the
 * delayed activation that gives the child components time to mount, the event listeners that
 * activate the widget before handling an event that comes first, and the clean-up.
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

    // Wait a bit before the relevant components, including the `aria-controls` targets, are
    // mounted. If the widget is unmounted in the meantime, nothing is set up.
    activateLater(this, () => this.destroyed);
  }

  /**
   * Listen to an event on the widget root until {@link destroy} is called. The widget is activated
   * before the event is handled, so an event that comes before the delayed activation isn’t lost.
   * @template {keyof HTMLElementEventMap} K
   * @param {K} type Event type.
   * @param {(event: HTMLElementEventMap[K]) => void} handler Event handler.
   */
  listen(type, handler) {
    this.parent.addEventListener(type, activateBefore(this, handler), {
      signal: this.#controller.signal,
    });
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
   * Whether the widget is disabled.
   * @type {boolean}
   */
  get isDisabled() {
    return this.parent.matches('[aria-disabled="true"]');
  }

  /**
   * Whether the widget is read-only.
   * @type {boolean}
   */
  get isReadOnly() {
    return this.parent.matches('[aria-readonly="true"]');
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
