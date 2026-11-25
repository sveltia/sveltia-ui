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
 * Get the state attributes of a form widget, such as a `<Switch>` or `<TextInput>`, which mirror
 * its `hidden`, `disabled`, `readonly`, `required` and `invalid` props. A `false` value is rendered
 * as `"false"`, like the attributes written out one by one.
 * @param {object} args Arguments.
 * @param {boolean | undefined} args.hidden Whether the widget is hidden.
 * @param {boolean | undefined} args.disabled Whether the widget is disabled.
 * @param {boolean | undefined} args.readonly Whether the widget is read-only.
 * @param {boolean | undefined} args.required Whether the widget is required.
 * @param {boolean | undefined} args.invalid Whether the widget is invalid.
 * @returns {{
 * 'aria-hidden': boolean | undefined,
 * 'aria-disabled': boolean | undefined,
 * 'aria-readonly': boolean | undefined,
 * 'aria-required': boolean | undefined,
 * 'aria-invalid': boolean | undefined,
 * }} Attributes.
 */
export const getWidgetStateAttrs = ({ hidden, disabled, readonly, required, invalid }) => ({
  'aria-hidden': hidden,
  'aria-disabled': disabled,
  'aria-readonly': readonly,
  'aria-required': required,
  'aria-invalid': invalid,
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

/**
 * Get the accessible name of a component, given as the `ariaLabel` prop or as a plain `aria-label`
 * attribute, which wrapper components pass through as is. An empty name counts as none, so it
 * doesn’t hide the other one, and isn’t rendered as an empty attribute.
 * @param {object} args Arguments.
 * @param {string | undefined} args.ariaLabel The `ariaLabel` prop.
 * @param {Record<string, any>} args.props Other props, which may hold the `aria-label` attribute.
 * @returns {string | undefined} Accessible name, if any.
 */
export const getAccessibleName = ({ ariaLabel, props }) =>
  ariaLabel || props['aria-label'] || undefined;

/**
 * Get the text of the label shown above a field with the `showLabelAbove` option, for a component
 * that renders the label itself rather than leaving it to an embedded `<TextInput>` or `<Select>`:
 * the field’s accessible name.
 * @param {object} args Arguments.
 * @param {boolean} args.showLabelAbove Whether to show the label above the field.
 * @param {Record<string, any>} args.props Props that hold the accessible name, if any.
 * @returns {string | undefined} Label text, or `undefined` if there’s no label to show.
 */
export const getLabelAboveText = ({ showLabelAbove, props }) =>
  showLabelAbove ? getAccessibleName({ ariaLabel: props.ariaLabel, props }) : undefined;
