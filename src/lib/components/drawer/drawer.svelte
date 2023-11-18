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
   * @type {'small' | 'medium' | 'large' | 'x-large'}
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
          <Icon slot="start-icon" name="close" />
        </Button>
      {/if}
    </div>
    {#if title || showClose === 'inside' || $$slots.header || $$slots['header-extra']}
      <div role="none" class="header">
        {#if $$slots.header}
          <slot name="header" />
        {:else}
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
              <Icon slot="start-icon" name="close" />
            </Button>
          {/if}
        {/if}
      </div>
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
    border-radius: 4px;
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

      .extra-control {
        inset: 0 100% auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(105%);
      }
    }

    &.left {
      inset: 0 auto 0 0;

      .extra-control {
        inset: 0 auto auto 100%;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(-105%);
      }
    }

    &.vertical {
      height: 100%;
      max-width: 100dvw;

      :global(dialog.open) & {
        max-width: calc(100dvw - 56px);
        transform: translateX(0%);
      }

      &.small {
        width: 400px;
      }

      &.medium {
        width: 600px;
      }

      &.large {
        width: 800px;
      }

      &.x-large {
        width: 1000px;
      }
    }

    &.top {
      inset: 0 0 auto 0;

      .extra-control {
        inset: 100% 0 auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(-105%);
      }
    }

    &.bottom {
      inset: auto 0 0 0;

      .extra-control {
        inset: auto 0 100% auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(105%);
      }
    }

    &.horizontal {
      width: 100%;
      max-height: 100dvh;

      :global(dialog.open) & {
        max-height: calc(100dvh - 56px);
        transform: translateY(0%);
      }

      &.small {
        height: 400px;
      }

      &.medium {
        height: 600px;
      }

      &.large {
        height: 800px;
      }

      &.x-large {
        height: 1000px;
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
    box-sizing: content-box;
    margin: 0 16px;
    border-width: 0 0 1px;
    border-color: var(--sui-secondary-border-color);
    padding: 16px 8px;
    height: 32px;

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
    padding: 24px;
    white-space: normal;
  }
</style>
