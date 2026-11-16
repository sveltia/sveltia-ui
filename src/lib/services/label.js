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

/**
 * Get the labelling attributes of the `<dialog>` in a `<Dialog>` or `<Drawer>`. The built-in header
 * renders the title in an element the dialog can point at; with a custom header the title is only
 * text, so it becomes `aria-label` unless the consumer names the labelling element.
 * @param {object} args Arguments.
 * @param {string} args.id Component ID. The title has the `${id}-title` ID.
 * @param {string | undefined} args.title Title, if any.
 * @param {string | undefined} args.ariaLabelledby ID of the labelling element named by the
 * consumer, if any.
 * @param {boolean} args.hasCustomHeader Whether the component has a custom header.
 * @returns {{ 'aria-label': string | undefined, 'aria-labelledby': string | undefined }}
 * Attributes.
 */
export const getModalLabelAttrs = ({ id, title, ariaLabelledby, hasCustomHeader }) => {
  const labelledby = ariaLabelledby ?? (!hasCustomHeader && title ? `${id}-title` : undefined);

  return {
    'aria-label': labelledby ? undefined : title || undefined,
    'aria-labelledby': labelledby,
  };
};
