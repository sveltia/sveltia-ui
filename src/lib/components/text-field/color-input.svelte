<!--
  @component
  A color swatch button that opens the browser’s color picker. The equivalent of the HTML
  `<input type="color">` element, styled like the other controls.
  @todo Replace the native `<input>` with a custom component.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
-->
<script>
  /**
   * @import { CommonEventHandlers, InputEventHandlers } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value, a lowercase hex color in the `#rrggbb` format. The
   * swatch shows black if no value is given.
   * @property {HTMLInputElement} [element] Reference to the `<input>` element.
   * @property {string} [class] The `class` attribute on the `<input>` element.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute. A native color input doesn’t support the `readonly` attribute, so
   * the picker is kept from opening instead, while the input stays focusable, so the current color
   * can still be reached and read by keyboard and assistive technology users, unlike with
   * `disabled`.
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
    class: className,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    ariaLabel = undefined,
    onclick,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Handle the `click` event. Prevent the picker from opening while read-only; the keyboard
   * activation with the Enter or Space key also fires a `click` event.
   * @param {MouseEvent} event The `click` event object.
   */
  const handleClick = (event) => {
    if (readonly) {
      event.preventDefault();
    }

    onclick?.(event);
  };

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
  type="color"
  class="sui color-input {className}"
  disabled={disabled || undefined}
  aria-label={ariaLabel ?? restProps['aria-label']}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  onclick={handleClick}
  oninput={handleInput}
/>

<style lang="scss">
  .color-input {
    display: inline-block;
    margin: var(--sui-focus-ring-width);
    border-width: var(--sui-color-input-border-width, 1px);
    border-color: var(--sui-color-input-border-color, var(--sui-control-border-color));
    border-radius: var(--sui-color-input-border-radius, var(--sui-button-medium-border-radius));
    padding: var(--sui-color-input-padding, 3px);
    width: var(--sui-color-input-width, calc(var(--sui-button-medium-height) * 1.5));
    height: var(--sui-color-input-height, var(--sui-button-medium-height));
    color: inherit;
    background-color: var(--sui-color-input-background-color, var(--sui-textbox-background-color));
    font-family: var(--sui-textbox-font-family);
    cursor: pointer;
    transition: all 200ms;

    &:is(:hover, :focus-visible) {
      background-color: var(
        --sui-color-input-background-color-focus,
        var(--sui-hover-background-color)
      );
    }

    &:active {
      background-color: var(
        --sui-color-input-background-color-active,
        var(--sui-active-background-color)
      );
    }

    &[aria-readonly='true'] {
      cursor: default;
      background-color: var(--sui-disabled-background-color);
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 1px solid var(--sui-secondary-border-color);
      border-radius: calc(var(--sui-button-medium-border-radius) / 2);
    }

    &::-moz-color-swatch {
      border: 1px solid var(--sui-secondary-border-color);
      border-radius: calc(var(--sui-button-medium-border-radius) / 2);
    }
  }
</style>
