<!--
  @component
  @see https://w3c.github.io/aria/#menuitem
-->
<script>
  import { writable } from 'svelte/store';
  import Menu from '../composite/menu.svelte';
  import Popup from '../util/popup.svelte';
  import Button from './button.svelte';
  import Icon from './icon.svelte';

  let className = '';

  export { className as class };

  /** @type {('menuitem'|'menuitemcheckbox'|'menuitemradio')} */
  export let role = 'menuitem';

  export let label = '';

  export let iconName = '';

  export let iconLabel = '';

  export let checked = false;

  /** @type {Button} */
  let buttonComponent;
  let isPopupOpen = writable(false);

  $: hasChildren = role === 'menuitem' && $$slots.default;
</script>

<div class="sui menuitem {className}">
  <Button
    {role}
    aria-checked={checked}
    aria-haspopup={hasChildren ? 'menu' : undefined}
    aria-expanded={$isPopupOpen ? true : undefined}
    {...$$restProps}
    bind:this={buttonComponent}
    on:click
    on:mouseenter={() => {
      isPopupOpen.set(true);
    }}
    on:mouseleave={() => {
      isPopupOpen.set(false);
    }}
  >
    {#if iconName}
      <Icon name={iconName} label={iconLabel} />
    {/if}
    {#if label}
      <span class="label">{label}</span>
    {/if}
    {#if role === 'menuitemradio' || role === 'menuitemcheckbox'}
      <span class="icon-outer">
        {#if checked}
          <Icon name="check" />
        {/if}
      </span>
    {/if}
    {#if hasChildren}
      <span class="icon-outer">
        <Icon name="chevron_right" />
      </span>
    {/if}
  </Button>
  {#if hasChildren}
    <Popup anchor={buttonComponent?.element} position="right-top" bind:open={isPopupOpen}>
      <Menu>
        <slot />
      </Menu>
    </Popup>
  {/if}
</div>

<style lang="scss">
  .menuitem {
    position: relative;

    :global(button) {
      display: flex;
      justify-content: space-between !important;
      border-radius: 4px;
      padding: 0 16px;
      width: 100%;
      min-width: 160px;
      height: var(--option--medium--height);
    }

    :global(button[aria-checked='true']) {
      :global(.icon) {
        color: var(--primary-accent-color-lighter);
      }
    }

    :global(button:hover),
    :global(button:focus) {
      color: var(--highlight-foreground-color);
      background-color: var(--highlight-background-color);
    }

    &:hover > :global([role='menu']) {
      opacity: 1;
    }

    & > :global([role='menu']) {
      position: absolute;
      inset: 2px auto auto calc(100% + 4px);

      &:hover {
        opacity: 1;
      }
    }
  }

  .icon-outer {
    flex: none;
    width: 24px;
    height: 24px;
  }
</style>
