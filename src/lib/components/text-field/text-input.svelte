<!--
  @component
  A generic, single-line text field. The equivalent of the HTML `<input type="text">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text
  @see https://w3c.github.io/aria/#textbox
-->
<svelte:options accessors={true} />

<script>
  import { activateKeyShortcuts } from '../util/events';
  import { getRandomId } from '../util/util';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {HTMLInputElement?} */
  export let element = undefined;

  /** @type {('textbox'|'searchbox'|'combobox'|'spinbutton')} */
  export let role = 'textbox';

  /**
   * Whether the textbox is editable.
   */
  export let readOnly = false;

  export let disabled = false;

  export let name = '';

  /** @type {(string | number | undefined)} */
  export let value = undefined;

  /**
   * Keyboard shortcuts.
   * @type {string}
   */
  export let keyShortcuts = '';

  const id = getRandomId('input');
  let ariaLabel = '';

  $: {
    // Replace `aria-label` with a visible label if `<input placeholder>` is not defined
    if ('aria-label' in $$restProps && !('placeholder' in $$restProps)) {
      ariaLabel = $$restProps['aria-label'];
      delete $$restProps['aria-label'];
      $$restProps['aria-labelledby'] = `${id}-label`;
    }
  }
</script>

<div class="sui text-input {className}">
  <input
    type="text"
    {role}
    name={name || undefined}
    tabindex={disabled ? -1 : 0}
    readOnly={readOnly ? true : undefined}
    aria-readonly={readOnly ? true : undefined}
    {disabled}
    aria-disabled={disabled ? true : undefined}
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
  {#if ariaLabel}
    <span id="{id}-label" class="label" class:hidden={!!value}>
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
    border-color: var(--sui-control-border-color);
    border-radius: var(--sui-textbox-medium-border-radius);
    padding: 0 8px;
    min-width: 0;
    height: var(--sui-textbox-medium-height);
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
      border-color: var(--sui-control-border-color) !important;
    }

    &:disabled {
      background-color: var(--sui-disabled-background-color);
      opacity: 0.4;
      cursor: default;
    }

    &[aria-invalid='true'] {
      border-color: deeppink;
    }

    ~ :global(button) {
      flex: none;
      margin-left: -1px;
      border-width: 1px;
      border-color: var(--sui-control-border-color);
      height: var(--sui-textbox-medium-height);
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
