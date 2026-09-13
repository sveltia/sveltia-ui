/**
 * Reordering logic behind `<SelectTags>`, kept apart from the component so it can be tested
 * without dragging anything.
 */

/**
 * Move an item within a list.
 * @template T
 * @param {T[]} list List.
 * @param {number} from Index of the item to move.
 * @param {number} to Index the item should end up at.
 * @returns {T[]} A new list with the item moved, or the same list if `from` and `to` are equal.
 */
export const moveItem = (list, from, to) => {
  if (from === to) {
    return list;
  }

  const newList = [...list];
  const [item] = newList.splice(from, 1);

  newList.splice(to, 0, item);

  return newList;
};

/**
 * Get the index a tag should move to when a key is pressed on it. The arrow keys swap it with a
 * neighbor, following the visual direction of the list, and Home/End move it to either end.
 * @param {object} options Options.
 * @param {string} options.key The key pressed.
 * @param {number} options.index Index of the tag.
 * @param {number} options.length Number of tags.
 * @param {boolean} options.rtl Whether the layout is right-to-left, in which case the arrow keys
 * are swapped.
 * @returns {number} Target index, or `-1` if the key doesn’t move the tag, including when it’s
 * already at the end the key would move it to.
 */
export const getKeyboardMoveTarget = ({ key, index, length, rtl }) => {
  const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';
  const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';

  if (key === prevKey && index > 0) {
    return index - 1;
  }

  if (key === nextKey && index < length - 1) {
    return index + 1;
  }

  if (key === 'Home' && index > 0) {
    return 0;
  }

  if (key === 'End' && index < length - 1) {
    return length - 1;
  }

  return -1;
};

/**
 * Get where a dragged tag would be inserted when the pointer is over another tag: before it when
 * the pointer is in the half nearer to the start of the list, after it otherwise.
 * @param {object} options Options.
 * @param {number} options.index Index of the tag under the pointer.
 * @param {number} options.clientX Horizontal position of the pointer.
 * @param {{ left: number, width: number }} options.rect Bounds of the tag under the pointer.
 * @param {boolean} options.rtl Whether the layout is right-to-left, in which case the start of the
 * list is on the right.
 * @returns {number} Insertion index: the dragged tag would be placed before the tag at this index,
 * so `length` means after the last one.
 */
export const getDropIndex = ({ index, clientX, rect, rtl }) => {
  const inFirstHalf = clientX < rect.left + rect.width / 2;

  return inFirstHalf !== rtl ? index : index + 1;
};

/**
 * Turn an insertion index into the index the dragged tag ends up at once it’s been taken out of
 * the list.
 * @param {number} fromIndex Index of the dragged tag.
 * @param {number} dropIndex Insertion index, as returned by {@link getDropIndex}.
 * @returns {number | undefined} Destination index for {@link moveItem}, or `undefined` if the
 * drop leaves the order unchanged, which is the case when the tag is dropped on either side of
 * its own position.
 */
export const getDropTarget = (fromIndex, dropIndex) => {
  if (dropIndex === fromIndex || dropIndex === fromIndex + 1) {
    return undefined;
  }

  return dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
};
