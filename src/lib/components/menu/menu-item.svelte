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

  $: hasChildren = role === 'menuitem' && $$slots.children;
</script>

<div role="none" class="sui menuitem {className}" hidden={hidden || undefined}>
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
    on:change
  >
    <slot name="start-icon" slot="start-icon">
      {#if iconName}
        <Icon name={iconName} aria-label={iconLabel} />
      {/if}
    </slot>
    <div role="none" class="content" class:label={!!label}>
      {#if label}
        {label}
      {:else}
        <slot />
      {/if}
    </div>
    <slot name="end-icon" slot="end-icon" />
    {#if hasChildren}
      <span role="none" class="icon-outer">
        <slot name="chevron-icon">
          <Icon name="chevron_right" />
        </slot>
      </span>
    {/if}
  </Button>
  {#if hasChildren}
    <Popup anchor={buttonComponent?.element} position="right-top" bind:open={isPopupOpen}>
      <Menu>
        <slot name="children" />
      </Menu>
    </Popup>
  {/if}
</div>

<style lang="scss">
  .menuitem {
    position: relative;

    :global(button) {
      display: flex;
      gap: var(--sui-menuitem-gap, 4px);
      align-items: var(--sui-menuitem-align-items, center);
      border-radius: var(--sui-menuitem-border-radius, var(--sui-option-border-radius, 4px));
      margin: 0 !important;
      padding: var(--sui-menuitem-padding, 0 16px);
      width: 100%;
      min-width: var(--sui-menuitem-min-width, 160px);
      height: var(--sui-menuitem-height, var(--sui-option-height));
      color: var(--sui-menuitem-foreground-color, var(--sui-control-foreground-color, inherit));
      background-color: var(--sui-menuitem-background-color, transparent);
      font-size: var(--sui-menuitem-font-size, var(--sui-option-font-size));
      font-weight: var(--sui-menuitem-font-weight, var(--sui-option-font-weight));
    }

    :global(button[aria-checked='true']) {
      :global(.icon) {
        color: var(--sui-primary-accent-color-text);
      }
    }

    :global(button:hover) {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-hover-background-color);
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

  .content {
    flex: auto;
  }

  .icon-outer {
    flex: none;
    width: 24px;
    height: 24px;
  }
</style>
