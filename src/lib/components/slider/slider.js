/**
 * Geometry and keyboard logic behind `<Slider>`, kept apart from the component so the value
 * calculations can be tested without a rendered track.
 */

/**
 * Count the fraction digits of a number, including one written in exponential notation, such as
 * `1e-7`.
 * @param {number} num Number.
 * @returns {number} Number of fraction digits, `0` for an integer.
 */
const countFractionDigits = (num) => {
  const [mantissa, exponent = '0'] = String(num).split('e');

  return Math.min(Math.max((mantissa.split('.')[1] ?? '').length - Number(exponent), 0), 100);
};

/**
 * Get the values a thumb can take and where each of them sits along the track.
 * @param {object} options Options.
 * @param {number} options.min Minimum value.
 * @param {number} options.max Maximum value.
 * @param {number} options.step Distance between two values.
 * @param {number} options.barWidth Width of the track in pixels.
 * @returns {{ valueList: number[], positionList: number[] }} Values from `min` to `max` in `step`
 * increments, and the matching pixel offsets from the logical start of the track.
 */
export const getSliderSteps = ({ min, max, step, barWidth }) => {
  const stepRatio = (max - min) / step;
  // Tolerate floating point errors, e.g. `0.3 / 0.1` is `2.9999999999999996`, which would otherwise
  // drop the maximum
  const stepCount = Math.floor(stepRatio + 1e-9) + 1;
  const stepWidth = barWidth / stepRatio;
  const emptyArray = Array.from({ length: stepCount });
  // Round the values to the precision of the minimum and the step, e.g. `3 * 0.1` is
  // `0.30000000000000004`, which would otherwise never match the `0.3` value
  const decimals = Math.max(countFractionDigits(min), countFractionDigits(step));

  return {
    valueList: emptyArray.map((_, index) => Number((index * step + min).toFixed(decimals))),
    positionList: emptyArray.map((_, index) => index * stepWidth),
  };
};

/**
 * Convert a physical pointer position into a logical one along the track. The logical position
 * always runs from the minimum value at `0` to the maximum at `barWidth`, so in a right-to-left
 * layout, where the minimum sits on the right, the axis is mirrored. The result is clamped to the
 * track, so a fast drag that overshoots the edge still resolves to the nearest valid position
 * instead of dropping the update.
 * @param {number} physicalX Position in pixels from the left edge of the track.
 * @param {number} barWidth Width of the track in pixels.
 * @param {boolean} rtl Whether the layout is right-to-left.
 * @returns {number} Logical position in pixels.
 */
export const toLogicalX = (physicalX, barWidth, rtl) =>
  Math.min(barWidth, Math.max(0, rtl ? barWidth - physicalX : physicalX));

/**
 * Find the step closest to the given position along the track.
 * @param {number[]} positionList Pixel offset of each step, in ascending order.
 * @param {number} logicalX Logical position in pixels.
 * @returns {number} Index of the nearest step, or `-1` if there are no steps.
 */
export const findNearestStepIndex = (positionList, logicalX) => {
  const fromIndex = positionList.findLastIndex((s) => s <= logicalX);
  const toIndex = positionList.findIndex((s) => logicalX <= s);

  if (fromIndex === -1) {
    return toIndex;
  }

  if (toIndex === -1) {
    return fromIndex;
  }

  const fromDiff = Math.abs(positionList[fromIndex] - logicalX);
  const toDiff = Math.abs(positionList[toIndex] - logicalX);

  return fromDiff < toDiff ? fromIndex : toIndex;
};

/**
 * Get the direction an arrow key moves the thumb in. The vertical keys don’t depend on the layout,
 * while the horizontal ones follow the visual direction of the track, so in a right-to-left layout
 * `ArrowLeft` increases the value.
 * @param {string} key The key pressed.
 * @param {boolean} rtl Whether the layout is right-to-left.
 * @returns {1 | -1 | 0} `1` to increase, `-1` to decrease, `0` if the key doesn’t move the thumb.
 */
export const getSliderKeyDirection = (key, rtl) => {
  if (key === 'ArrowUp' || key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
    return 1;
  }

  if (key === 'ArrowDown' || key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
    return -1;
  }

  return 0;
};

/**
 * Get the step index a key moves the thumb to, per the APG Slider pattern: the arrow keys move by
 * one step, Page Up/Down by a tenth of the range, and Home/End jump to either end.
 * @param {object} options Options.
 * @param {string} options.key The key pressed.
 * @param {boolean} options.rtl Whether the layout is right-to-left.
 * @param {number} options.currentIndex Index of the current step.
 * @param {number} options.length Number of steps.
 * @returns {number} Target index, clamped to the range, or `-1` if the key doesn’t move the thumb
 * or the thumb is already where the key would take it.
 */
export const getSliderKeyTargetIndex = ({ key, rtl, currentIndex, length }) => {
  const lastIndex = length - 1;
  const page = Math.max(1, Math.round(length / 10));
  /** @type {number} */
  let index;

  if (key === 'Home') {
    index = 0;
  } else if (key === 'End') {
    index = lastIndex;
  } else if (key === 'PageUp') {
    index = currentIndex + page;
  } else if (key === 'PageDown') {
    index = currentIndex - page;
  } else {
    const direction = getSliderKeyDirection(key, rtl);

    if (!direction) {
      return -1;
    }

    index = currentIndex + direction;
  }

  index = Math.min(lastIndex, Math.max(0, index));

  return index === currentIndex ? -1 : index;
};

/**
 * Whether moving one thumb of a multi-thumb slider to the given position would make it cross, or
 * land on, the other thumb.
 * @param {object} options Options.
 * @param {number} options.valueIndex Index of the thumb being moved, `0` or `1`.
 * @param {number} options.targetPosition Position the thumb would move to, in pixels.
 * @param {number[]} options.sliderPositions Current position of each thumb, in pixels.
 * @returns {boolean} `true` if the move would cross the other thumb.
 */
export const wouldCrossThumbs = ({ valueIndex, targetPosition, sliderPositions }) =>
  (valueIndex === 0 && sliderPositions[1] <= targetPosition) ||
  (valueIndex === 1 && sliderPositions[0] >= targetPosition);

/**
 * Get the step index a key press starts from. A value that sits between two steps, such as `55`
 * with a step of `10`, has no index of its own, so it starts from the step below when the key
 * increases the value and from the step above when it decreases it. That way the first press
 * moves the thumb to the adjacent step in the direction of the key.
 * @param {object} options Options.
 * @param {number[]} options.valueList Values of each step, in ascending order.
 * @param {number} options.value Current value.
 * @param {boolean} options.decreasing Whether the key decreases the value.
 * @returns {number} Index of the current step. It can be `-1` or `valueList.length` for a value
 * below the minimum or above the maximum, so any move brings it back into the range.
 */
export const getSliderCurrentIndex = ({ valueList, value, decreasing }) => {
  const index = valueList.indexOf(value);

  if (index !== -1) {
    return index;
  }

  if (decreasing) {
    const upperIndex = valueList.findIndex((v) => v > value);

    return upperIndex === -1 ? valueList.length : upperIndex;
  }

  return valueList.findLastIndex((v) => v < value);
};

/**
 * Find the thumb of a multi-thumb slider closest to the given position, so a click on the track
 * moves that one. When both thumbs sit at the same spot, the second one is picked for a position
 * after it and the first one otherwise, so the click never has to cross the other thumb.
 * @param {number[]} sliderPositions Current position of each thumb, in pixels.
 * @param {number} logicalX Logical position in pixels.
 * @returns {number} Index of the nearest thumb, `0` or `1`.
 */
export const getNearestThumbIndex = (sliderPositions, logicalX) => {
  const [position0, position1] = sliderPositions;
  const diff0 = Math.abs(position0 - logicalX);
  const diff1 = Math.abs(position1 - logicalX);

  if (diff0 === diff1) {
    return logicalX > position1 ? 1 : 0;
  }

  return diff1 < diff0 ? 1 : 0;
};
