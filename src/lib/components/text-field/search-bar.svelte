<!--
  @component
  The equivalent of the HTML `<input type="search">` element. It comes with a magnifier icon and
  clear button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search
  @see https://w3c.github.io/aria/#search
-->
<svelte:options accessors={true} />

<script>
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {import('svelte').SvelteComponent} */
  let input;

  export let value = '';

  /**
   * Move focus to the `<input>` element.
   */
  export const focus = () => {
    input?.element?.focus();
  };
</script>

<div class="sui search-bar {className}" role="search">
  <Icon name="search" />
  <TextInput
    bind:this={input}
    bind:value
    role="searchbox"
    {...$$restProps}
    on:input
    on:keydown
    on:keyup
    on:keypress
    on:change
  />
  {#if value}
    <Button
      class="iconic"
      on:click={() => {
        value = '';
        input.element.focus();
        window.requestIdleCallback(() => {
          input.element.dispatchEvent(new KeyboardEvent('input'));
          input.element.dispatchEvent(new KeyboardEvent('keypress'));
          input.element.dispatchEvent(new KeyboardEvent('change'));
        });
      }}
    >
      <Icon slot="start-icon" name="close" label={$_('_sui._.clear')} />
    </Button>
  {/if}
</div>

<style lang="scss">
  [role='search'] {
    display: flex;
    align-items: center;
    position: relative;

    :global(.icon) {
      font-size: var(--sui-font-size-xx-large);
      opacity: 0.5;
    }

    & > :global(.icon) {
      position: absolute;
      inset: 8px auto auto 8px;
      z-index: 2;
    }

    & > :global(button) {
      position: absolute;
      inset: 0 0 auto auto;
      z-index: 2;
      height: var(--sui-button-medium-height);
    }

    :global(.label) {
      inset: 0 36px;
    }

    :global(input) {
      padding: 0 36px !important;
      width: 100%;
    }
  }
</style>
