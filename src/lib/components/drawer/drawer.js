/**
 * Geometry behind the swipe-to-dismiss gesture of `<Drawer>`, kept apart from the component so the
 * calculations can be tested without a rendered drawer.
 */

/**
 * @typedef {object} SwipeSample
 * @property {number} offset Distance the drawer has been dragged towards its edge, in pixels.
 * @property {number} time Time of the sample in milliseconds, such as an event’s
 * `timeStamp`.
 */

/**
 * @typedef {object} SwipeState
 * @property {number} pointerId ID of the pointer dragging the drawer.
 * @property {'X' | 'Y'} axis Axis along which the drawer is dragged.
 * @property {1 | -1} sign Sign of the direction towards the edge. See {@link getSwipeDirection}.
 * @property {number} start Position along the axis where the drag has started, in pixels.
 * @property {SwipeSample[]} samples Recent samples. See {@link addSwipeSample}.
 */

/**
 * Portion of the drawer’s size it has to be dragged by to be dismissed on release.
 */
export const SWIPE_DISMISS_DISTANCE_RATIO = 0.3;

/**
 * Speed in pixels per millisecond towards the edge at which a release dismisses the drawer, however
 * short the drag, so a quick flick is enough.
 */
export const SWIPE_DISMISS_VELOCITY = 0.5;

/**
 * Distance in pixels a flick has to cover to dismiss the drawer, so a finger that rolls a little
 * while tapping the header doesn’t count as one.
 */
export const SWIPE_FLICK_MIN_DISTANCE = 16;

/**
 * Time window in milliseconds over which the speed of a drag is measured when it’s released.
 */
export const SWIPE_VELOCITY_WINDOW = 100;

/**
 * Get the axis along which the drawer is swiped away, and the sign of the physical direction
 * towards the edge it’s attached to.
 * @param {'top' | 'right' | 'bottom' | 'left'} position Position of the drawer.
 * @param {boolean} rtl Whether the layout is right-to-left, which mirrors the `left` and `right`
 * positions: they’re logical, like the `inset-inline` properties they’re laid out with.
 * @returns {{ axis: 'X' | 'Y', sign: 1 | -1 }} Axis, named as in `translateX()` and
 * `translateY()`, and sign.
 */
export const getSwipeDirection = (position, rtl) => {
  if (position === 'top' || position === 'bottom') {
    return { axis: 'Y', sign: position === 'bottom' ? 1 : -1 };
  }

  return { axis: 'X', sign: (position === 'right') !== rtl ? 1 : -1 };
};

/**
 * Get the distance the drawer has been dragged towards its edge. A drag the other way is ignored:
 * the drawer can’t be pulled out further than it’s open.
 * @param {number} delta Physical distance the pointer has moved along the axis, in pixels.
 * @param {1 | -1} sign Sign of the direction towards the edge. See {@link getSwipeDirection}.
 * @returns {number} Offset in pixels, `0` or more.
 */
export const getSwipeOffset = (delta, sign) => Math.max(0, delta * sign);

/**
 * Add a sample to the list the speed of a drag is measured with, dropping the ones that have left
 * the measuring window.
 * @param {SwipeSample[]} samples Previous samples, oldest first.
 * @param {SwipeSample} sample New sample.
 * @returns {SwipeSample[]} Samples within {@link SWIPE_VELOCITY_WINDOW}, oldest first.
 */
export const addSwipeSample = (samples, sample) => [
  ...samples.filter(({ time }) => sample.time - time <= SWIPE_VELOCITY_WINDOW),
  sample,
];

/**
 * Get the speed of a drag towards the edge.
 * @param {SwipeSample[]} samples Recent samples, oldest first. See {@link addSwipeSample}.
 * @returns {number} Speed in pixels per millisecond, negative if the drag was heading back.
 */
export const getSwipeVelocity = (samples) => {
  const first = samples[0];
  const last = samples[samples.length - 1];

  if (!first || !last || last.time <= first.time) {
    return 0;
  }

  return (last.offset - first.offset) / (last.time - first.time);
};

/**
 * Check whether a drag that has just been released should dismiss the drawer: it has been dragged
 * far enough, or flicked towards its edge.
 * @param {object} args Arguments.
 * @param {number} args.offset Distance the drawer has been dragged towards its edge, in pixels.
 * @param {number} args.size Size of the drawer along the axis, in pixels.
 * @param {number} args.velocity Speed of the drag towards the edge, in pixels per millisecond.
 * @returns {boolean} Result.
 */
export const shouldDismissSwipe = ({ offset, size, velocity }) =>
  offset > 0 &&
  (offset >= size * SWIPE_DISMISS_DISTANCE_RATIO ||
    (offset >= SWIPE_FLICK_MIN_DISTANCE && velocity >= SWIPE_DISMISS_VELOCITY));
