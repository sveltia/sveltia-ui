<!--
  @component
  A menu item widget.
  @see https://w3c.github.io/aria/#menuitem
-->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Popup from '../util/popup.svelte';
  import Menu from './menu.svelte';

  /**
   * @import {
   * ButtonProps,
   * CommonEventHandlers,
   * MenuItemProps,
   * PopupPosition,
   * } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {PopupPosition} [popupPosition] Where to show the dropdown menu.
   */

  /**
   * @type {ButtonProps & MenuItemProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    role = 'menuitem',
    hidden = false,
    disabled = false,
    label = '',
    popupPosition = 'right-top', // @todo Make this auto detect
    children: _children,
    startIcon: _startIcon,
    endIcon: _endIcon,
    chevronIcon,
    items,
    onmouseenter,
    onmouseleave,
    onclick,
    onChange,
    onSelect,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  let isPopupOpen = $state(false);
  let isPopupHovered = $state(false);

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  let buttonElement = $state();

  /**
   * Reference to the `<button>` element.
   * @type {HTMLDialogElement | undefined}
   */
  let dialogElement = $state();

  const hasItems = $derived(role === 'menuitem' && !!items);

  onMount(() => {
    dialogElement = buttonElement?.closest('dialog') ?? undefined;
  });
</script>

<div role="none" class="sui menuitem {className}" {hidden}>
  <Button
    bind:element={buttonElement}
    {...restProps}
    {role}
    {hidden}
    {disabled}
    aria-haspopup={hasItems ? 'menu' : undefined}
    aria-expanded={hasItems ? isPopupOpen : undefined}
    onmouseenter={(event) => {
      if (hasItems) {
        window.setTimeout(() => {
          isPopupOpen = true;
        }, 200);
      }

      onmouseenter?.(event);
    }}
    onmouseleave={(event) => {
      if (hasItems) {
        window.setTimeout(() => {
          if (!isPopupHovered) {
            isPopupOpen = false;
          }
        }, 200);
      }

      onmouseleave?.(event);
    }}
    onclick={(event) => {
      if (hasItems) {
        event.preventDefault();
        event.stopPropagation();
        isPopupOpen = !isPopupOpen;
      }

      onclick?.(event);
    }}
    {onChange}
    {onSelect}
  >
    {#snippet startIcon()}
      {@render _startIcon?.()}
    {/snippet}
    {#snippet children()}
      <div role="none" class="content" class:label={!!label}>
        {#if label}
          {label}
        {:else}
          {@render _children?.()}
        {/if}
      </div>
      {#if hasItems}
        <span role="none" class="icon-outer">
          {#if chevronIcon}
            {@render chevronIcon()}
          {:else}
            <Icon name={browser && document.dir === 'rtl' ? 'chevron_left' : 'chevron_right'} />
          {/if}
        </span>
      {/if}
    {/snippet}
    {#snippet endIcon()}
      {@render _endIcon?.()}
    {/snippet}
  </Button>
  {#if hasItems && buttonElement && dialogElement}
    <Popup
      anchor={buttonElement}
      parentDialogElement={dialogElement}
      position={popupPosition}
      bind:open={isPopupOpen}
      bind:hovered={isPopupHovered}
    >
      <Menu>
        {@render items?.()}
      </Menu>
    </Popup>
  {/if}
</div>

<style lang="scss">
  .menuitem {
    position: relative;

    :global {
      button {
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
        font-weight: var(
          --sui-menuitem-font-weight,
          var(--sui-option-font-weight, var(--sui-font-weight-normal, normal))
        );

        &[aria-checked='true'] {
          .icon {
            color: var(--sui-primary-accent-color-text);
          }
        }

        &:hover {
          color: var(--sui-highlight-foreground-color);
          background-color: var(--sui-hover-background-color);
        }

        &:active {
          background-color: var(--sui-active-background-color);
        }
      }

      &:hover > [role='menu'] {
        opacity: 1;
      }

      & > [role='menu'] {
        position: absolute;
        inset-block-start: 2px;
        inset-block-end: auto;
        inset-inline-start: calc(100% + 4px);
        inset-inline-end: auto;

        &:hover {
          opacity: 1;
        }
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
