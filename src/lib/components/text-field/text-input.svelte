<!--
  @component
  A generic, single-line text field. The equivalent of the HTML `<input type="text">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { activateKeyShortcuts } from '../../services/events.svelte';
  import TruncatedText from '../typography/truncated-text.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, InputEventHandlers, TextInputProps } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   */

  /**
   * @type {TextInputProps & CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    element = $bindable(),
    role = 'textbox',
    keyShortcuts = undefined,
    name = undefined,
    showInlineLabel = false,
    inputmode = 'text',
    flex = false,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    'aria-label': ariaLabel,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
</script>

<div
  role="none"
  class="sui text-input {className}"
  class:flex
  class:disabled
  class:readonly
  {hidden}
>
  <input
    bind:this={element}
    {...restProps}
    bind:value
    type="text"
    {role}
    dir="auto"
    name={name || undefined}
    tabindex={disabled ? -1 : 0}
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    {inputmode}
    aria-label={ariaLabel}
    aria-hidden={hidden}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-required={required}
    aria-invalid={invalid}
    use:activateKeyShortcuts={keyShortcuts}
  />
  {#if ariaLabel && showInlineLabel}
    <span id="{id}-label" class="label" class:hidden={!!value} aria-hidden="true">
      <TruncatedText>
        {ariaLabel}
      </TruncatedText>
    </span>
  {/if}
</div>

<style lang="scss">
  .text-input {
    display: inline-flex;
    align-items: center;
    position: relative;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    &.flex {
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }
  }

  // https://stackoverflow.com/a/68240841
  input:-webkit-autofill,
  input:-webkit-autofill:focus {
    transition:
      background-color 0s 600000s,
      color 0s 600000s;
  }

  input {
    display: inline-block;
    flex: auto;
    border-width: var(--sui-textbox-border-width, 1px);
    border-color: var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius);
    padding: var(--sui-textbox-singleline-padding);
    min-width: 0;
    height: var(--sui-textbox-height);
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-singleline-line-height);
    font-weight: var(--sui-textbox-font-weight, var(--sui-font-weight-normal, normal));
    text-align: var(--sui-textbox-text-align, start);
    text-indent: var(--sui-textbox-text-indent, 0);
    text-transform: var(--sui-textbox-text-transform, none);
    letter-spacing: var(--sui-textbox-letter-spacing, normal);
    word-spacing: var(--sui-word-spacing-normal, normal);
    transition: all 200ms;

    &:focus {
      border-color: var(--sui-textbox-border-color-focus, var(--sui-primary-accent-color));
      color: var(--sui-textbox-foreground-color-focus, var(--sui-textbox-foreground-color));
      background-color: var(
        --sui-textbox-background-color-focus,
        var(--sui-textbox-background-color)
      );
    }

    &:read-only {
      color: var(--sui-tertiary-foreground-color);
      border-color: var(--sui-textbox-border-color) !important;
    }

    &:disabled,
    &:read-only {
      background-color: var(--sui-disabled-background-color);
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }

    ~ :global(button) {
      flex: none;
      margin-left: -1px;
      border-width: 1px;
      border-color: var(--sui-textbox-border-color);
      height: var(--sui-textbox-height);
      aspect-ratio: 1 / 1;

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      :global(.icon) {
        font-size: var(--sui-font-size-xx-large);
      }
    }
  }

  .label {
    position: absolute;
    inset: var(--sui-textbox-singleline-padding);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: var(
      --sui-textbox-placeholder-text-align,
      var(--sui-textbox-text-align, start)
    );
    pointer-events: none;

    &.hidden {
      opacity: 0;
    }
  }

  input:focus + .label {
    opacity: 0;
  }

  input::placeholder,
  .label {
    color: var(--sui-textbox-placeholder-foreground-color, var(--sui-textbox-foreground-color));
    opacity: var(--sui-textbox-placeholder-opacity, 0.5);
    font-family: var(--sui-textbox-placeholder-font-family, var(--sui-textbox-font-family));
    font-size: var(--sui-textbox-placeholder-font-size, var(--sui-textbox-font-size));
    line-height: var(
      --sui-textbox-placeholder-singleline-line-height,
      var(--sui-textbox-singleline-line-height)
    );
    font-weight: var(
      --sui-textbox-placeholder-font-weight,
      var(--sui-textbox-font-weight, var(--sui-font-weight-normal, normal))
    );
    text-align: var(--sui-textbox-placeholder-text-align, var(--sui-textbox-text-align, start));
    text-indent: var(--sui-textbox-placeholder-text-indent, var(--sui-textbox-text-indent, 0));
    letter-spacing: var(
      --sui-textbox-placeholder-letter-spacing,
      var(--sui-textbox-letter-spacing, normal)
    );
  }
</style>
