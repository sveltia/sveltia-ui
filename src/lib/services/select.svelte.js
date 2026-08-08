import { getContext, setContext } from 'svelte';

/**
 * @import { OptionEntry, SelectedItemDetail } from '$lib/typedefs';
 */

/**
 * Context key for {@link OptionRegistry}.
 */
const CONTEXT_KEY = Symbol('sui-option-registry');

/**
 * Reactive registry of the `<Option>`s declared within a `<Combobox>`.
 *
 * The options only render their DOM while the dropdown is expanded, so a collapsed combobox can’t
 * look them up with `querySelector`. Each `<Option>` instead registers a live view of its own props
 * here, which lets the combobox resolve the current label and the initially selected value without
 * keeping the option elements in the DOM tree.
 *
 * The order of the registered options is not significant. Svelte still renders the options itself,
 * in declaration order, so nothing here has to reproduce that order.
 */
export class OptionRegistry {
  /**
   * Whether the dropdown is expanded, meaning the options should render their DOM.
   * @type {boolean}
   */
  expanded = $state(false);

  /**
   * Registered options. This is a raw state so that the entries, which expose their properties as
   * getters onto the `<Option>`’s props, are not wrapped in a reactive proxy.
   * @type {OptionEntry[]}
   */
  #entries = $state.raw([]);

  /**
   * Number of registered options.
   * @returns {number} Count.
   */
  get count() {
    return this.#entries.length;
  }

  /**
   * The option that is currently marked as selected, if any.
   * @returns {OptionEntry | undefined} Matching option.
   */
  get selectedEntry() {
    return this.#entries.find((entry) => entry.selected);
  }

  /**
   * Register an option.
   * @param {OptionEntry} entry Live view of the option’s props.
   * @returns {() => void} Function to unregister the option.
   */
  register(entry) {
    this.#entries = [...this.#entries, entry];

    return () => {
      this.#entries = this.#entries.filter((item) => item !== entry);
    };
  }

  /**
   * Find the option with the given value.
   * @param {any} value Value to look for.
   * @returns {OptionEntry | undefined} Matching option.
   */
  find(value) {
    return this.#entries.find((entry) => entry.value === value);
  }

  /**
   * Mark the option with the given value as the only selected one.
   * @param {any} value Value to select.
   */
  selectOnly(value) {
    this.#entries.forEach((entry) => {
      const selected = entry.value === value;

      if (entry.selected !== selected) {
        entry.selected = selected;
      }
    });
  }
}

/**
 * Create an option registry and provide it to the descendant `<Option>`s.
 * @returns {OptionRegistry} New registry.
 */
export const createOptionRegistry = () => setContext(CONTEXT_KEY, new OptionRegistry());

/**
 * Get the option registry provided by an ancestor `<Combobox>`.
 * @returns {OptionRegistry | undefined} Registry, or `undefined` when the `<Option>` is used
 * standalone within a `<Listbox>`.
 */
export const getOptionRegistry = () => getContext(CONTEXT_KEY);

/**
 * Get the detail of the selected element.
 * @param {HTMLElement} target Element to get the detail from.
 * @returns {SelectedItemDetail} Detail of the selected element.
 */
export const getSelectedItemDetail = (target) => {
  const { type = 'string', name, label } = target.dataset;
  /** @type {any} */
  let { value } = target.dataset;

  if (type === 'number') {
    value = Number(value);

    if (Number.isNaN(value)) {
      value = null;
    }
  } else if (type === 'boolean') {
    value = value === 'true';
  } else if (type === 'string') {
    value = value ? String(value) : '';
  }

  return { target, type, name, label, value };
};
