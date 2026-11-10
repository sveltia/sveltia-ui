/**
 * Get the labelling attributes of the `<button>` in a `<Checkbox>` or `<Radio>`. An accessible name
 * given as a prop or as a plain `aria-label` attribute takes the place of the visible label, which
 * the button otherwise points at — but only when there is one to point at.
 * @param {object} args Arguments.
 * @param {string} args.id Component ID. The visible label has the `${id}-label` ID.
 * @param {string | undefined} args.ariaLabel Accessible name, if any.
 * @param {boolean} args.hasVisibleLabel Whether the component has a visible label.
 * @returns {{ 'aria-label': string | undefined, 'aria-labelledby': string | undefined }}
 * Attributes.
 */
export const getToggleLabelAttrs = ({ id, ariaLabel, hasVisibleLabel }) => ({
  'aria-label': ariaLabel || undefined,
  'aria-labelledby': !ariaLabel && hasVisibleLabel ? `${id}-label` : undefined,
});
