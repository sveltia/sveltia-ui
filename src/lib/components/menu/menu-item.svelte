<!--
  @component
  A menu item widget.
  @see https://w3c.github.io/aria/#menuitem
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Popup from '../util/popup.svelte';
  import Menu from './menu.svelte';

  /**
   * @type {import('$lib/typedefs').ButtonProps & import('$lib/typedefs').MenuItemProps &
   * import('$lib/typedefs').CommonEventHandlers & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    role = 'menuitem',
    hidden = false,
    disabled = false,
    label = '',
    children: _children,
    startIcon: _startIcon,
    endIcon: _endIcon,
    chevronIcon,
    items,
    onChange,
    onSelect,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  let isPopupOpen = $state(false);

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  let buttonElement = $state();

  const hasItems = $derived(role === 'menuitem' && !!items);
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
    onmouseenter={() => {
      if (hasItems) {
        isPopupOpen = true;
      }
    }}
    onmouseleave={() => {
      if (hasItems) {
        isPopupOpen = false;
      }
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
            <Icon name="chevron_right" />
          {/if}
        </span>
      {/if}
    {/snippet}
    {#snippet endIcon()}
      {@render _endIcon?.()}
    {/snippet}
  </Button>
  {#if hasItems}
    <Popup anchor={buttonElement} position="right-top" bind:open={isPopupOpen}>
      <Menu>
        {@render items?.()}
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
      font-weight: var(
        --sui-menuitem-font-weight,
        var(--sui-option-font-weight, var(--sui-font-weight-normal, normal))
      );
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
