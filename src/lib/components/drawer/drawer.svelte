<!--
  @component
  A generic drawer widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { _ } from 'svelte-i18n';
  import { getRandomId } from '$lib/services/util';
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';
  import Modal from '../util/modal.svelte';

  /**
   * The `class` attribute on the content element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to open the drawer.
   * @type {boolean}
   */
  export let open = false;
  /**
   * Title text displayed on the header.
   * @type {string}
   */
  export let title = '';
  /**
   * Position of the drawer.
   * @type {'top' | 'right' | 'bottom' | 'left'}
   */
  export let position = 'right';
  /**
   * Width or height of the drawer.
   * @type {'small' | 'medium' | 'large' | 'x-large' | 'full'}
   */
  export let size = 'small';
  /**
   * Whether to show the Close button.
   * @type {'inside' | 'outside' | false}
   */
  export let showClose = 'outside';
  /**
   * Whether to close the modal when the backdrop (outside of the modal) is clicked.
   * @type {boolean}
   */
  export let lightDismiss = false;
  /**
   * Whether to keep the content in the DOM tree when the modal is not displayed.
   * @type {boolean}
   */
  export let keepContent = false;

  /**
   * The ID of the drawer.
   * @type {string}
   */
  const id = getRandomId('drawer');
  /**
   * A reference to the modal component.
   * @type {Modal}
   */
  let modal;

  $: orientation = position === 'right' || position === 'left' ? 'vertical' : 'horizontal';
</script>

<Modal
  {id}
  class="drawer"
  bind:open
  showBackdrop
  {lightDismiss}
  {keepContent}
  {...$$restProps}
  bind:this={modal}
  on:opening
  on:open
  on:ok
  on:cancel
  on:closing
  on:close
>
  <div role="none" class="content {className} {size} {position} {orientation}">
    <div role="none" class="extra-control">
      {#if showClose === 'outside'}
        <Button
          variant="ghost"
          iconic
          class="close"
          aria-label={$_('_sui.close')}
          aria-controls={id}
          on:click={() => {
            modal.close('close');
          }}
        >
          <slot name="close-button" slot="start-icon">
            <Icon name="close" />
          </slot>
        </Button>
      {/if}
    </div>
    {#if title || showClose === 'inside' || $$slots.header || $$slots['header-extra']}
      {#if $$slots.header}
        <slot name="header" />
      {:else}
        <div role="none" class="header">
          <div role="none" class="title">
            {title}
          </div>
          <Spacer flex={true} />
          {#if $$slots['header-extra']}
            <slot name="header-extra" />
          {/if}
          {#if showClose === 'inside'}
            <Button
              variant="ghost"
              iconic
              class="close"
              aria-label={$_('_sui.close')}
              aria-controls={id}
              on:click={() => {
                modal.close('close');
              }}
            >
              <slot name="close-button" slot="start-icon">
                <Icon name="close" />
              </slot>
            </Button>
          {/if}
        </div>
      {/if}
    {/if}
    <div role="none" class="main">
      <slot />
    </div>
    {#if $$slots.footer}
      <div role="none" class="footer">
        <slot name="footer" />
      </div>
    {/if}
  </div>
</Modal>

<style lang="scss">
  .content {
    position: absolute;
    display: flex;
    flex-direction: column;
    max-width: 100dvw;
    max-height: 100dvh;
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    transition-property: transform;

    .extra-control {
      position: absolute;

      :global(button.close) {
        margin: 8px;
      }
    }

    :global(dialog.open) & {
      transition-duration: 150ms;
      transform: translateX(0%);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
    }

    &.right {
      inset: 0 0 0 auto;
      border-radius: var(
        --sui-drawer-right-content-border-radius,
        var(--sui-drawer-content-border-radius, 4px 0 0 4px)
      );

      &.full {
        border-radius: var(--sui-drawer-right-full-content-border-radius, 0);
      }

      .extra-control {
        inset: 0 100% auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(105%);
      }
    }

    &.left {
      inset: 0 auto 0 0;
      border-radius: var(
        --sui-drawer-left-content-border-radius,
        var(--sui-drawer-content-border-radius, 0 4px 4px 0)
      );

      &.full {
        border-radius: var(--sui-drawer-left-full-content-border-radius, 0);
      }

      .extra-control {
        inset: 0 auto auto 100%;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(-105%);
      }
    }

    &.vertical {
      max-width: var(--sui-drawer-vertical-max-width, calc(100dvw - 56px));
      height: var(--sui-drawer-vertical-height, 100dvh);

      :global(dialog.open) & {
        transform: translateX(0%);
      }

      &.small {
        width: var(--sui-drawer-vertical-small-width, 400px);
      }

      &.medium {
        width: var(--sui-drawer-vertical-medium-width, 600px);
      }

      &.large {
        width: var(--sui-drawer-vertical-large-width, 800px);
      }

      &.x-large {
        width: var(--sui-drawer-vertical-x-large-width, 1000px);
      }

      &.full {
        width: 100dvw;
        max-width: 100dvw;
        height: 100dvh;
      }
    }

    &.top {
      inset: 0 0 auto 0;
      border-radius: var(
        --sui-drawer-top-content-border-radius,
        var(--sui-drawer-content-border-radius, 0 0 4px 4px)
      );

      &.full {
        border-radius: var(--sui-drawer-top-full-content-border-radius, 0);
      }

      .extra-control {
        inset: 100% 0 auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(-105%);
      }
    }

    &.bottom {
      inset: auto 0 0 0;
      border-radius: var(
        --sui-drawer-bottom-content-border-radius,
        var(--sui-drawer-content-border-radius, 4px 4px 0 0)
      );

      &.full {
        border-radius: var(--sui-drawer-bottom-full-content-border-radius, 0);
      }

      .extra-control {
        inset: auto 0 100% auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(105%);
      }
    }

    &.horizontal {
      width: var(--sui-drawer-horizontal-width, 100dvw);
      max-height: var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px));

      :global(dialog.open) & {
        transform: translateY(0%);
      }

      &.small {
        height: var(--sui-drawer-horizontal-small-height, 400px);
      }

      &.medium {
        height: var(--sui-drawer-horizontal-medium-height, 600px);
      }

      &.large {
        height: var(--sui-drawer-horizontal-large-height, 800px);
      }

      &.x-large {
        height: var(--sui-drawer-horizontal-x-large-height, 1000px);
      }

      &.full {
        width: 100dvw;
        height: 100dvh;
        max-height: 100dvh;
      }
    }
  }

  .header,
  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header {
    flex-direction: var(--sui-drawer-header-flex-direction, row);
    box-sizing: content-box;
    margin: var(--sui-drawer-header-margin, 0 16px);
    border-width: var(--sui-drawer-header-border-width, 0 0 1px);
    border-color: var(--sui-drawer-header-border-color, var(--sui-secondary-border-color));
    padding: var(--sui-drawer-header-padding, 16px 8px);
    height: var(--sui-drawer-header-height, 32px);

    .title {
      font-size: var(--sui-font-size-large);
    }
  }

  .footer {
    margin: 0 24px 24px;
  }

  .main {
    flex: auto;
    overflow: auto;
    padding: var(--sui-drawer-main-padding, 24px);
    white-space: normal;
  }
</style>
