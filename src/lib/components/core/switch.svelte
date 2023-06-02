<!--
  @component
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

<label class="sui switch {className}" class:disabled>
  <input type="checkbox" role="switch" bind:checked {disabled} />
  <span />
  {#if label}
    {label}
  {:else}
    <slot />
  {/if}
</label>

<style lang="scss">
  label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &.disabled {
      cursor: default;
    }
  }

  input {
    position: absolute;
    left: -99999px;

    &:focus + span {
      background-color: var(--highlight-background-color);
    }
  }

  input:checked + span {
    background-color: var(--primary-accent-color);
    border-color: transparent;

    &::before {
      transform: translateX(22px);
      background-color: var(--primary-accent-color-foreground);
    }
  }

  input:disabled + span {
    opacity: 0.4;
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
