/**
 * Arrow key navigation shared by the composite widgets. These functions only map a key and the
 * current position to a new position; finding the members and moving focus is up to the caller.
 */

/**
 * Get the arrow keys that move to the previous and next member along the given orientation. In a
 * right-to-left layout, the inline arrows are mirrored: ArrowLeft moves forward, ArrowRight back.
 * @param {string} orientation `horizontal` or `vertical`.
 * @param {boolean} rtl Whether the layout runs right to left.
 * @returns {{ prevKey: string, nextKey: string }} Keys.
 */
export const getArrowKeys = (orientation, rtl) => {
  if (orientation === 'horizontal') {
    return rtl
      ? { prevKey: 'ArrowRight', nextKey: 'ArrowLeft' }
      : { prevKey: 'ArrowLeft', nextKey: 'ArrowRight' };
  }

  return { prevKey: 'ArrowUp', nextKey: 'ArrowDown' };
};

/**
 * Get the index to move to in a list when an arrow key is pressed. The movement wraps around at
 * either end, and with nothing current yet, the previous key starts from the last member and the
 * next key from the first one.
 * @param {object} args Arguments.
 * @param {string} args.key Pressed key.
 * @param {number} args.index Index of the current member, or `-1` if there’s none.
 * @param {number} args.count Number of members.
 * @param {string} args.prevKey Key that moves to the previous member.
 * @param {string} args.nextKey Key that moves to the next member.
 * @returns {number} Index of the member to move to, or `-1` if the key doesn’t move.
 */
export const getLinearTargetIndex = ({ key, index, count, prevKey, nextKey }) => {
  if (key === prevKey) {
    return index > 0 ? index - 1 : count - 1;
  }

  if (key === nextKey) {
    return index < count - 1 ? index + 1 : 0;
  }

  return -1;
};

/**
 * Get the index to move to in a grid layout when an arrow key is pressed. The vertical arrows move
 * by a visual row and the inline arrows by a single member, and none of them wraps around. With
 * nothing current yet, the arrows start from either end, as in a list.
 * @param {object} args Arguments.
 * @param {string} args.key Pressed key.
 * @param {number} args.index Index of the current member, or `-1` if there’s none.
 * @param {number} args.count Number of members.
 * @param {number} args.columnCount Number of members per visual row.
 * @param {string} args.prevKey Inline key that moves to the previous member.
 * @param {string} args.nextKey Inline key that moves to the next member.
 * @returns {number} Index of the member to move to, or `-1` if the key doesn’t move.
 */
export const getGridTargetIndex = ({ key, index, count, columnCount, prevKey, nextKey }) => {
  const lastIndex = count - 1;
  const backward = key === 'ArrowUp' || key === prevKey;
  const forward = key === 'ArrowDown' || key === nextKey;

  if (index === -1) {
    if (forward) {
      return 0;
    }

    return backward ? lastIndex : -1;
  }

  if (backward && index > 0) {
    // Up by a row, stopping at the first member
    return key === 'ArrowUp' ? Math.max(index - columnCount, 0) : index - 1;
  }

  if (forward && index < lastIndex) {
    // Down by a row; a partial last row still gets reached
    return key === 'ArrowDown' ? Math.min(index + columnCount, lastIndex) : index + 1;
  }

  return -1;
};
