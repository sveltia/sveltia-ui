<!--
  @component
  A menu item widget.
  @see https://w3c.github.io/aria/#menuitem
-->
<script>
  import { writable } from 'svelte/store';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Popup from '../util/popup.svelte';
  import Menu from './menu.svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `role` attribute on the `<button>` element.
   * @type {'menuitem' | 'menuitemcheckbox' | 'menuitemradio'}
   */
  export let role = 'menuitem';
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
   * Text label displayed on the item.
   * @type {string | undefined}
   */
  export let label = '';
  /**
   * Name of `<Icon>` displayed before the label.
   */
  export let iconName = '';
  /**
   * ARIA label of `<Icon>` displayed before the label.
   */
  export let iconLabel = '';

  /** @type {Button} */
  let buttonComponent;
  let isPopupOpen = writable(false);

  $: hasChildren = role === 'menuitem' && $$slots.default;
</script>

<div class="sui menuitem {className}" hidden={hidden || undefined}>
  <Button
    {role}
    {hidden}
    {disabled}
    aria-haspopup={hasChildren ? 'menu' : undefined}
    aria-expanded={hasChildren ? $isPopupOpen : undefined}
    {...$$restProps}
    bind:this={buttonComponent}
    on:click
    on:mouseenter={() => {
      if (hasChildren) {
        $isPopupOpen = true;
      }
    }}
    on:mouseleave={() => {
      if (hasChildren) {
        $isPopupOpen = false;
      }
    }}
    on:select
  >
    {#if iconName}
      <Icon slot="start-icon" name={iconName} label={iconLabel} />
    {/if}
    {#if label}
      <span class="label">{label}</span>
    {/if}
    {#if $$slots['end-icon']}
      <span class="icon-outer">
        <slot name="end-icon" />
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
      border-radius: var(--sui-option-border-radius);
      padding: 0 16px;
      width: 100%;
      min-width: 160px;
      height: var(--sui-option-height);
    }

    :global(button[aria-checked='true']) {
      :global(.icon) {
        color: var(--sui-primary-accent-color-lighter);
      }
    }

    :global(button:hover) {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-highlight-background-color);
    }

    :global(button:active) {
      background-color: var(--sui-active-background-color);
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
