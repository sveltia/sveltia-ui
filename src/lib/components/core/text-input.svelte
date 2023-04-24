<!--
  @component
  @see https://w3c.github.io/aria/#textbox
-->
<svelte:options accessors={true} />

<script>
  import { getRandomId } from '../helpers/util';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {(HTMLInputElement|undefined)} */
  export let element = undefined;

  /** @type {('textbox'|'searchbox'|'combobox'|'spinbutton')} */
  export let role = 'textbox';

  /**
   * Whether the textbox is editable.
   */
  export let readOnly = false;

  export let disabled = false;

  export let name = '';

  /** @type {(String|undefined)} */
  export let value = undefined;

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
    {readOnly}
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
    border-color: var(--control-border-color);
    border-radius: var(--input--medium--border-radius);
    padding: 0 8px;
    min-width: 0;
    height: var(--input--medium--height);
    background-color: var(--control-background-color);
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    line-height: 30px;
    transition: all 200ms;

    &:focus {
      border-color: var(--primary-accent-color);
    }

    &:read-only {
      color: var(--ternary-foreground-color);
      border-color: var(--control-border-color) !important;
    }

    &:disabled {
      background-color: var(--disabled-background-color);
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
      border-color: var(--control-border-color);
      height: var(--input--medium--height);
      aspect-ratio: 1 / 1;

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      :global(.icon) {
        font-size: 20px;
      }
    }
  }

  .label {
    position: absolute;
    inset: 0 8px;
    z-index: 2;
    display: flex;
    justify-content: var(--input-label-align, flex-start);
    align-items: center;
    color: var(--primary-foreground-color);
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
