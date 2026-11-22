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
  import { getAccessibleName } from '../../services/label.js';
  import LabelAbove from '../util/label-above.svelte';

  /**
   * @import {
   * CommonEventHandlers,
   * FormFieldStateProps,
   * InputEventHandlers,
   * LabelAboveProps,
   * } from '#lib/typedefs.js';
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
   * @property {string} [class] The `class` attribute on the `<input>` element, or on its wrapper
   * when there’s a label above it, so the class still sizes the whole field.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {string} [ariaLabel] `aria-label` attribute.
   */

  /**
   * @type {LabelAboveProps & CommonEventHandlers & InputEventHandlers & FormFieldStateProps &
   * Props & Record<string, any>}
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
    showLabelAbove = false,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const uid = $props.id();
  /** ID of the `<input>` element, which the label above it points to. */
  const inputId = $derived(restProps.id ?? `${uid}-input`);
  const label = $derived(getAccessibleName({ ariaLabel, props: restProps }));
  /** Label shown above the field with `showLabelAbove`, which wraps the input. */
  const labelAbove = $derived(showLabelAbove ? label : undefined);

  /**
   * Update the `value` and call the `oninput` callback.
   * @param {Event} event The `input` event object.
   */
  const handleInput = (event) => {
    value = /** @type {HTMLInputElement} */ (event.currentTarget).value;
    oninput?.(event);
  };
</script>

{#snippet field()}
  <input
    bind:this={element}
    {...restProps}
    id={inputId}
    value={value ?? ''}
    {type}
    {min}
    {max}
    {step}
    class="sui date-time-input {labelAbove ? '' : className}"
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    aria-label={label}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-required={required}
    aria-invalid={invalid}
    oninput={handleInput}
  />
{/snippet}

<!-- The input is the root element, so it’s only wrapped when there’s a label to show above it -->
{#if labelAbove}
  <div role="none" class="sui date-time-input-wrapper {className}">
    <LabelAbove label={labelAbove} for={inputId} />
    {@render field()}
  </div>
{:else}
  {@render field()}
{/if}

<style lang="scss">
  @use '../../styles/mixins';

  // The wrapper is sized like the bare input would be, and the grid stretches the input to fill
  // it, within its margin
  .date-time-input-wrapper {
    display: inline-grid;
  }

  .date-time-input {
    display: inline-block;
    margin: var(--sui-focus-ring-width);
    width: auto;
    min-width: 0;
    height: var(--sui-textbox-height);
    // Show the AM/PM marker in uppercase, whatever the locale’s default case is
    text-transform: var(--sui-date-time-input-text-transform, uppercase);
    font-variant-numeric: tabular-nums;

    @include mixins.textbox($text-formatting: false);
    @include mixins.textbox-disabled;

    &::-webkit-calendar-picker-indicator {
      cursor: pointer;
    }

    &:is(:disabled, :read-only)::-webkit-calendar-picker-indicator {
      cursor: default;
    }
  }
</style>
