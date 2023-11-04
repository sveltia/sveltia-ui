<!--
  @component
  A generic, single-line text field. The equivalent of the HTML `<input type="text">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
  @see https://w3c.github.io/aria/#textbox
-->
<svelte:options accessors={true} />

<script>
  import { activateKeyShortcuts } from '../../services/events';
  import { getRandomId } from '../../services/util';

  /**
   * Reference to the `<input>` element.
   * @type {HTMLInputElement | undefined}
   */
  export let element = undefined;
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `role` attribute on the `<input>` element.
   * @type {'textbox' | 'searchbox' | 'combobox' | 'spinbutton'}
   */
  export let role = 'textbox';
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to disable the widget. An alias of `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to disable the widget. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to disable the widget. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Keyboard shortcuts. An alias of the `aria-keyshortcuts` attribute. Accepts the special `Accel`
   * key, which will be replaced with `Control` or `Meta` depending on the user’s operating system.
   * @type {string | undefined}
   */
  export let keyShortcuts = undefined;
  /**
   * The `name` attribute on the `<input>` element.
   * @type {string | undefined}
   */
  export let name = undefined;
  /**
   * Input value.
   * @type {string | number | undefined}
   */
  export let value = undefined;
  /**
   * Whether to display `aria-label` over the `<input>` element if it’s empty, just like how the
   * HTML `placeholder` attribute works.
   * @type {boolean}
   */
  export let showInlineLabel = false;

  const id = getRandomId('input');

  $: ariaLabel = $$restProps['aria-label'];
</script>

<div class="sui text-input {className}" hidden={hidden || undefined}>
  <input
    type="text"
    {role}
    name={name || undefined}
    tabindex={disabled ? -1 : 0}
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    aria-hidden={hidden}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-required={required}
    aria-invalid={invalid}
    {...$$restProps}
    bind:this={element}
    bind:value
    on:input
    on:keydown
    on:keyup
    on:keypress
    on:change
    use:activateKeyShortcuts={keyShortcuts}
  />
  {#if ariaLabel && showInlineLabel}
    <span id="{id}-label" class="label" class:hidden={!!value} aria-hidden="true">
      {ariaLabel}
    </span>
  {/if}
</div>

<style lang="scss">
  .text-input {
    position: relative;
    width: 100%;
    display: inline-flex;
    align-items: center;
  }

  input {
    z-index: 1;
    display: inline-block;
    flex: auto;
    border-width: 1px;
    border-color: var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius);
    padding: 0 8px;
    min-width: 0;
    height: var(--sui-textbox-height);
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-singleline-line-height);
    transition: all 200ms;

    &:focus {
      border-color: var(--sui-primary-accent-color);
    }

    &:read-only {
      color: var(--sui-tertiary-foreground-color);
      border-color: var(--sui-textbox-border-color) !important;
    }

    &:disabled {
      background-color: var(--sui-disabled-background-color);
      opacity: 0.4;
      cursor: default;
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-foreground-color);
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
    inset: 0 8px;
    z-index: 2;
    display: flex;
    justify-content: var(--sui-textbox-label-align, flex-start);
    align-items: center;
    color: var(--sui-primary-foreground-color);
    opacity: 0.5;
    pointer-events: none;

    &.hidden {
      opacity: 0;
    }
  }

  input:focus + .label {
    opacity: 0;
  }
</style>
