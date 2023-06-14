<!--
  @component
  A variant of `<Checkbox>`, looking like a switch that can be often seen on mobile apps.
  @see https://w3c.github.io/aria/#switch
  @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let label = '';

  export let checked = false;

  export let disabled = false;
</script>

<button
  class="sui switch {className}"
  {disabled}
  role="switch"
  aria-disabled={disabled}
  aria-checked={checked}
  on:click={() => {
    checked = !checked;
  }}
>
  <span />
  {#if label}
    {label}
  {:else}
    <slot />
  {/if}
</button>

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-width: 0;
    border-style: solid;
    border-color: transparent;
    padding: 0;
    color: inherit;
    background-color: transparent;
    box-shadow: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &:disabled {
      cursor: default;

      span {
        opacity: 0.4;
      }
    }

    &:focus-visible {
      outline: 0;

      span::before {
        outline-offset: 1px;
        outline-width: 2px;
        outline-style: solid;
        outline-color: var(--primary-accent-color-lighter);
      }
    }

    &[aria-checked='true'] {
      span {
        background-color: var(--primary-accent-color);
        border-color: transparent;

        &::before {
          transform: translateX(22px);
          background-color: var(--primary-accent-color-foreground);
        }
      }
    }
  }

  span {
    position: relative;
    width: 42px;
    height: 20px;
    padding: 2px;
    display: inline-block;
    border-radius: 16px;
    background-color: var(--control-border-color);
    transition: all 200ms;

    &:hover {
      background-color: var(--highlight-background-color);
    }

    &::before {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 16px;
      background-color: var(--primary-accent-color-foreground);
      transition: all 200ms;
      content: '';
    }
  }
</style>
