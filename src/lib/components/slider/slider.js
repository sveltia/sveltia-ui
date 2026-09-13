/**
 * Geometry and keyboard logic behind `<Slider>`, kept apart from the component so the value
 * calculations can be tested without a rendered track.
 */

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
  const stepCount = (max - min) / step + 1;
  const stepWidth = barWidth / (stepCount - 1);
  const emptyArray = Array.from({ length: stepCount });

  return {
    valueList: emptyArray.map((_, index) => index * step + min),
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
