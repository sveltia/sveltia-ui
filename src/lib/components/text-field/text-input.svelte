<!--
  @component
  A generic, single-line text field. The equivalent of the HTML `<input type="text">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { activateKeyShortcuts } from '@sveltia/utils/events';
  import { getAccessibleName, getWidgetStateAttrs } from '../../services/label.js';
  import TruncatedText from '../typography/truncated-text.svelte';
  import LabelAbove from '../util/label-above.svelte';
  import EmojiAutocomplete from './emoji-autocomplete.svelte';

  /**
   * @import {
   * CommonEventHandlers,
   * InputEventHandlers,
   * LabelAboveProps,
   * TextInputProps,
   * } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   * @property {boolean} [useEmojiAutocomplete] Whether to autocomplete emojis when the user
   * types a shortcode, like `:smi`.
   */

  /**
   * @type {LabelAboveProps & TextInputProps & CommonEventHandlers & InputEventHandlers & Props &
   * Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    element: boundElement = $bindable(),
    role = 'textbox',
    keyShortcuts = undefined,
    dir = undefined,
    name = undefined,
    showInlineLabel = false,
    showLabelAbove = false,
    inputmode = 'text',
    flex = false,
    monospace = false,
    debounce = false,
    useEmojiAutocomplete = false,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    ariaLabel = undefined,
    children,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * A reference to the `<input>` element. It’s kept apart from the bindable `element` prop, which
   * Svelte resets whenever the props spread onto this component change, unless the consumer binds
   * it.
   * @type {HTMLInputElement | undefined}
   */
  let element = $state.raw();

  const id = $props.id();
  /** ID of the `<input>` element, which the label above it points to. */
  const inputId = $derived(restProps.id ?? `${id}-input`);
  const timeout = $derived(typeof debounce === 'number' ? debounce : 300);
  /**
   * Accessible label, whether given as the `ariaLabel` prop or as a plain `aria-label` attribute,
   * which the wrapper components such as `<SearchBar>` and `<NumberInput>` pass through as is.
   * @type {string | undefined}
   */
  const label = $derived(getAccessibleName({ ariaLabel, props: restProps }));
  /** Label shown above the field with `showLabelAbove`, in place of the inline one. */
  const labelAbove = $derived(showLabelAbove ? label : undefined);

  let debounceTimer = 0;

  $effect(() => () => {
    clearTimeout(debounceTimer);
  });

  /**
   * Update the `value` and call the `oninput` callback.
   * @param {InputEvent} event The `input` event object.
   */
  const fireInput = (event) => {
    value = element?.value;
    oninput?.(event);
  };

  /**
   * Handle the `input` event. If `debounce` is `true`, the event will be debounced by 300ms. We use
   * `oninputcapture` to ensure that the event is fired before any `oninput` handlers on parent
   * elements, including the Lexical editor.
   * @param {Event} event The `input` event object.
   */
  const handleInput = (event) => {
    const inputEvent = /** @type {InputEvent} */ (event);

    if (debounce) {
      clearTimeout(debounceTimer);
      debounceTimer = /** @type {number} */ (
        /** @type {unknown} */ (
          setTimeout(() => {
            fireInput(inputEvent);
          }, timeout)
        )
      );
    } else {
      fireInput(inputEvent);
    }
  };
</script>

<div
  role="none"
  class="sui text-input {className}"
  class:flex
  class:monospace
  class:disabled
  class:readonly
  class:has-label-above={!!labelAbove}
  {hidden}
>
  {#if labelAbove}
    <LabelAbove label={labelAbove} for={inputId} />
  {/if}
  <input
    bind:this={
      () => element,
      (el) => {
        element = el;
        boundElement = el;
      }
    }
    type="text"
    {...restProps}
    id={inputId}
    {value}
    {role}
    {dir}
    {name}
    tabindex={disabled ? -1 : 0}
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    {inputmode}
    aria-label={label}
    {...getWidgetStateAttrs({ hidden, disabled, readonly, required, invalid })}
    oninputcapture={handleInput}
    {@attach activateKeyShortcuts(keyShortcuts)}
  />
  {#if useEmojiAutocomplete && !disabled && !readonly}
    <EmojiAutocomplete {element} />
  {/if}
  {#if label && showInlineLabel && !labelAbove}
    <span id="{id}-label" class="label" class:hidden={!!value} aria-hidden="true">
      <TruncatedText>
        {label}
      </TruncatedText>
    </span>
  {/if}
</div>

<style lang="scss">
  @use '../../styles/mixins';

  .text-input {
    display: inline-flex;
    align-items: center;
    position: relative;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    @include mixins.flex-stretch;

    // The label takes a line of its own, above the input
    &.has-label-above {
      flex-wrap: wrap;
    }

    &.monospace {
      --sui-textbox-font-family: var(--sui-font-family-monospace, monospace);

      // A placeholder is a hint in words, e.g. that a key is set elsewhere, rather than a value
      input::placeholder {
        font-family: var(--sui-control-font-family);
      }
    }
  }

  // https://stackoverflow.com/a/68240841
  input:is(:-webkit-autofill, :-webkit-autofill:focus) {
    transition:
      background-color 0s 600000s,
      color 0s 600000s;

    // Chrome shows a filled-in value in a system font until the user interacts with the page.
    // Set the font explicitly, as inheriting it from the field would bring back the system one
    &::first-line {
      font-family: var(--sui-textbox-font-family);
      font-size: var(--sui-textbox-font-size);
      font-weight: var(--sui-textbox-font-weight, var(--sui-font-weight-normal, normal));
    }
  }

  input {
    display: inline-block;
    flex: auto;
    min-width: 0;
    height: var(--sui-textbox-height);

    @include mixins.textbox;
    @include mixins.textbox-disabled;

    :global {
      & ~ button {
        @include mixins.attached-button(height);
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
