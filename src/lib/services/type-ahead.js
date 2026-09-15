/**
 * Type-ahead support shared by the composite widgets: the collapsed select-only combobox, and the
 * listbox and menu groups.
 */

/**
 * How long, in milliseconds, successive keystrokes keep adding up to one type-ahead prefix.
 */
export const TYPE_AHEAD_TIMEOUT = 500;

/**
 * Keystroke buffer behind type-ahead: printable keys typed in quick succession make up a prefix,
 * which is dropped again after a short pause.
 */
export class TypeAhead {
  /** @type {string} */
  #prefix = '';

  /** @type {number} */
  #timer = 0;

  /**
   * Add a keystroke to the prefix.
   * @param {string} key Printable key.
   * @returns {string} Current prefix.
   */
  push(key) {
    globalThis.clearTimeout(this.#timer);
    this.#prefix += key.toLocaleLowerCase();
    this.#timer = /** @type {number} */ (
      /** @type {unknown} */ (
        globalThis.setTimeout(() => {
          this.#prefix = '';
        }, TYPE_AHEAD_TIMEOUT)
      )
    );

    return this.#prefix;
  }

  /**
   * Drop the prefix.
   */
  reset() {
    globalThis.clearTimeout(this.#timer);
    this.#prefix = '';
  }
}

/**
 * Find the item that a type-ahead prefix lands on, the way a native `<select>` does. A single
 * character moves to the next item after the current one whose label starts with it, wrapping
 * around, and a repeated character (“aa”, …) keeps cycling through those. A longer prefix refines
 * the match from the current item, which is where the first character landed.
 * @param {string[]} labels Normalized item labels, in order.
 * @param {string} prefix Normalized prefix typed so far.
 * @param {number} currentIndex Index of the current item, or `-1` if there is none.
 * @returns {number} Index of the matching item, or `-1` if nothing matches.
 */
export const findTypeAheadMatch = (labels, prefix, currentIndex) => {
  if (!prefix) {
    return -1;
  }

  const cycling = prefix.length > 1 && [...prefix].every((char) => char === prefix[0]);
  const needle = cycling ? prefix[0] : prefix;
  // A single or repeated character is a request to move on, so the search starts after the current
  // item; a longer prefix is refining what the first character found, so it starts there
  const start = prefix.length === 1 || cycling ? currentIndex + 1 : Math.max(currentIndex, 0);
  const { length } = labels;

  for (let i = 0; i < length; i += 1) {
    const index = (start + i) % length;

    if (labels[index].startsWith(needle)) {
      return index;
    }
  }

  return -1;
};
