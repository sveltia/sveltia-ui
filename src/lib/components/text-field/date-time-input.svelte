<!--
  @component
  A date and/or time field. The equivalent of the HTML `<input type="date">`,
  `<input type="datetime-local">` and `<input type="time">` elements, styled like the other text
  fields. The browser’s native picker is kept, and follows the light or dark theme through the
  inherited `color-scheme`.
  @todo Replace the native `<input>` with a custom component.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time
-->
<script>
  /**
   * @import { CommonEventHandlers, InputEventHandlers } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value, in the native input’s format: `YYYY-MM-DD` for `date`,
   * `YYYY-MM-DDTHH:mm` (with optional seconds) for `datetime-local`, and `HH:mm` (with optional
   * seconds) for `time`. An empty string if no value is entered.
   * @property {HTMLInputElement} [element] Reference to the `<input>` element.
   * @property {'date' | 'datetime-local' | 'time'} [type] The `type` attribute on the `<input>`.
   * @property {string} [min] Minimum allowed value, in the same format as `value`.
   * @property {string} [max] Maximum allowed value, in the same format as `value`.
   * @property {number | 'any'} [step] Stepping interval: in days for `date`, in seconds for
   * `datetime-local` and `time`. A step under 60 for the latter two shows the seconds.
   * @property {string} [class] The `class` attribute on the `<input>` element.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {string} [ariaLabel] `aria-label` attribute.
   */

  /**
   * @type {CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    element = $bindable(),
    type = 'date',
    min = undefined,
    max = undefined,
    step = undefined,
    class: className,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    ariaLabel = undefined,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Update the `value` and call the `oninput` callback.
   * @param {Event} event The `input` event object.
   */
  const handleInput = (event) => {
    value = /** @type {HTMLInputElement} */ (event.currentTarget).value;
    oninput?.(event);
  };
</script>

<input
  bind:this={element}
  {...restProps}
  value={value ?? ''}
  {type}
  {min}
  {max}
  {step}
  class="sui date-time-input {className}"
  disabled={disabled || undefined}
  readonly={readonly || undefined}
  aria-label={ariaLabel ?? restProps['aria-label']}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  oninput={handleInput}
/>

<style lang="scss">
  .date-time-input {
    display: inline-block;
    margin: var(--sui-focus-ring-width);
    border-width: var(--sui-textbox-border-width, 1px);
    border-color: var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius);
    padding: var(--sui-textbox-singleline-padding);
    width: auto;
    min-width: 0;
    height: var(--sui-textbox-height);
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-singleline-line-height);
    font-weight: var(--sui-textbox-font-weight, var(--sui-font-weight-normal, normal));
    // Show the AM/PM marker in uppercase, whatever the locale’s default case is
    text-transform: var(--sui-date-time-input-text-transform, uppercase);
    letter-spacing: var(--sui-textbox-letter-spacing, normal);
    font-variant-numeric: tabular-nums;
    transition: all 200ms;

    &:focus {
      color: var(--sui-textbox-foreground-color-focus, var(--sui-textbox-foreground-color));
      background-color: var(
        --sui-textbox-background-color-focus,
        var(--sui-textbox-background-color)
      );
    }

    &:read-only {
      color: var(--sui-secondary-foreground-color);
      border-color: var(--sui-textbox-border-color) !important;
    }

    &:is(:disabled, :read-only) {
      background-color: var(--sui-disabled-background-color);
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }

    &::-webkit-calendar-picker-indicator {
      cursor: pointer;
    }

    &:is(:disabled, :read-only)::-webkit-calendar-picker-indicator {
      cursor: default;
    }
  }
</style>
