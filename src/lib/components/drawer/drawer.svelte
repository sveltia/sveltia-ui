<!--
  @component
  A generic drawer widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';
  import Modal from '../util/modal.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ModalProps } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the content element.
   * @property {boolean} [open] Whether to open the drawer.
   * @property {string} [title] Title text displayed on the header.
   * @property {'top' | 'right' | 'bottom' | 'left'} [position] Position of the drawer.
   * @property {'small' | 'medium' | 'large' | 'x-large' | 'full'} [size] Width or height of the
   * drawer.
   * @property {'inside' | 'outside' | false} [showClose] Whether to show the Close button.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [header] Header slot content.
   * @property {Snippet} [headerExtra] Header extra slot content.
   * @property {Snippet} [footer] Footer slot content.
   * @property {Snippet} [closeIcon] Close icon slot content.
   * @property {Snippet} [extraContent] Extra content slot content.
   */

  /**
   * @type {ModalProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    class: className,
    title = '',
    position = 'right',
    size = 'small',
    showClose = 'outside',
    children,
    header,
    headerExtra,
    footer,
    closeIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * The ID of the drawer.
   * @type {string}
   */
  const id = $props.id();

  /**
   * A reference to the modal component.
   * @type {any}
   */
  let modal = $state();

  const orientation = $derived(
    position === 'right' || position === 'left' ? 'vertical' : 'horizontal',
  );
</script>

<Modal bind:this={modal} {...restProps} bind:open {id} class="drawer" showBackdrop>
  <div role="none" class="content {className} {size} {position} {orientation}">
    <div role="none" class="extra-control">
      {#if showClose === 'outside'}
        <Button
          variant="ghost"
          iconic
          class="close"
          aria-label={$_('_sui.close')}
          aria-controls={id}
          onclick={() => {
            modal?.close('close');
          }}
        >
          {#snippet startIcon()}
            {#if closeIcon}
              {@render closeIcon()}
            {:else}
              <Icon name="close" />
            {/if}
          {/snippet}
        </Button>
      {/if}
    </div>
    {#if title || showClose === 'inside' || header || headerExtra}
      {#if header}
        {@render header()}
      {:else}
        <div role="none" class="header">
          <div role="none" class="title">
            {title}
          </div>
          <Spacer flex={true} />
          {@render headerExtra?.()}
          {#if showClose === 'inside'}
            <Button
              variant="ghost"
              iconic
              class="close"
              aria-label={$_('_sui.close')}
              aria-controls={id}
              onclick={() => {
                modal?.close('close');
              }}
            >
              {#snippet startIcon()}
                {#if closeIcon}
                  {@render closeIcon()}
                {:else}
                  <Icon name="close" />
                {/if}
              {/snippet}
            </Button>
          {/if}
        </div>
      {/if}
    {/if}
    <div role="none" class="main">
      {@render children?.()}
    </div>
    {#if footer}
      <div role="none" class="footer">
        {@render footer?.()}
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
      inset: var(--sui-drawer-right-content-inset, 0 0 0 auto);
      border-radius: var(
        --sui-drawer-right-content-border-radius,
        var(--sui-drawer-content-border-radius, 4px 0 0 4px)
      );

      &.full {
        border-radius: var(
          --sui-drawer-right-full-content-border-radius,
          var(--sui-drawer-right-content-border-radius, 0)
        );
      }

      .extra-control {
        inset: 0 100% auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(105%);
      }
    }

    &.left {
      inset: var(--sui-drawer-left-content-inset, 0 auto 0 0);
      border-radius: var(
        --sui-drawer-left-content-border-radius,
        var(--sui-drawer-content-border-radius, 0 4px 4px 0)
      );

      &.full {
        border-radius: var(
          --sui-drawer-left-full-content-border-radius,
          var(--sui-drawer-left-content-border-radius, 0)
        );
      }

      .extra-control {
        inset: 0 auto auto 100%;
      }

      :global(dialog:not(.open)) & {
        transform: translateX(-105%);
      }
    }

    &.vertical {
      :global(dialog.open) & {
        transform: translateX(0%);
      }

      &.small {
        width: var(--sui-drawer-vertical-small-width, var(--sui-drawer-vertical-width, 400px));
        max-width: var(
          --sui-drawer-vertical-small-max-width,
          var(--sui-drawer-vertical-max-width, calc(100dvw - 56px))
        );
        height: var(--sui-drawer-vertical-small-height, var(--sui-drawer-vertical-height, 100dvh));
      }

      &.medium {
        width: var(--sui-drawer-vertical-medium-width, var(--sui-drawer-vertical-width, 600px));
        max-width: var(
          --sui-drawer-vertical-medium-max-width,
          var(--sui-drawer-vertical-max-width, calc(100dvw - 56px))
        );
        height: var(--sui-drawer-vertical-medium-height, var(--sui-drawer-vertical-height, 100dvh));
      }

      &.large {
        width: var(--sui-drawer-vertical-large-width, var(--sui-drawer-vertical-width, 800px));
        max-width: var(
          --sui-drawer-vertical-large-max-width,
          var(--sui-drawer-vertical-max-width, calc(100dvw - 56px))
        );
        height: var(--sui-drawer-vertical-large-height, var(--sui-drawer-vertical-height, 100dvh));
      }

      &.x-large {
        width: var(--sui-drawer-vertical-x-large-width, var(--sui-drawer-vertical-width, 1000px));
        max-width: var(
          --sui-drawer-vertical-x-large-max-width,
          var(--sui-drawer-vertical-max-width, calc(100dvw - 56px))
        );
        height: var(
          --sui-drawer-vertical-x-large-height,
          var(--sui-drawer-vertical-height, 100dvh)
        );
      }

      &.full {
        width: 100dvw;
        max-width: 100dvw;
        height: 100dvh;
      }
    }

    &.top {
      inset: var(--sui-drawer-top-content-inset, 0 0 auto 0);
      border-radius: var(
        --sui-drawer-top-content-border-radius,
        var(--sui-drawer-content-border-radius, 0 0 4px 4px)
      );

      &.full {
        border-radius: var(
          --sui-drawer-top-full-content-border-radius,
          var(--sui-drawer-top-content-border-radius, 0)
        );
      }

      .extra-control {
        inset: 100% 0 auto auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(-105%);
      }
    }

    &.bottom {
      inset: var(--sui-drawer-bottom-content-inset, auto 0 0 0);
      border-radius: var(
        --sui-drawer-bottom-content-border-radius,
        var(--sui-drawer-content-border-radius, 4px 4px 0 0)
      );

      &.full {
        border-radius: var(
          --sui-drawer-bottom-full-content-border-radius,
          var(--sui-drawer-bottom-content-border-radius, 0)
        );
      }

      .extra-control {
        inset: auto 0 100% auto;
      }

      :global(dialog:not(.open)) & {
        transform: translateY(105%);
      }
    }

    &.horizontal {
      :global(dialog.open) & {
        transform: translateY(0%);
      }

      &.small {
        width: var(--sui-drawer-horizontal-small-width, var(--sui-drawer-horizontal-width, 100dvw));
        height: var(
          --sui-drawer-horizontal-small-height,
          var(--sui-drawer-horizontal-height, 400px)
        );
        max-height: var(
          --sui-drawer-horizontal-small-max-height,
          var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px))
        );
      }

      &.medium {
        width: var(
          --sui-drawer-horizontal-medium-width,
          var(--sui-drawer-horizontal-width, 100dvw)
        );
        height: var(
          --sui-drawer-horizontal-medium-height,
          var(--sui-drawer-horizontal-height, 600px)
        );
        max-height: var(
          --sui-drawer-horizontal-medium-max-height,
          var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px))
        );
      }

      &.large {
        width: var(--sui-drawer-horizontal-large-width, var(--sui-drawer-horizontal-width, 100dvw));
        height: var(
          --sui-drawer-horizontal-large-height,
          var(--sui-drawer-horizontal-height, 800px)
        );
        max-height: var(
          --sui-drawer-horizontal-large-max-height,
          var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px))
        );
      }

      &.x-large {
        width: var(
          --sui-drawer-horizontal-x-large-width,
          var(--sui-drawer-horizontal-width, 100dvw)
        );
        height: var(
          --sui-drawer-horizontal-x-large-height,
          var(--sui-drawer-horizontal-height, 1000px)
        );
        max-height: var(
          --sui-drawer-horizontal-x-large-max-height,
          var(--sui-drawer-horizontal-max-height, calc(100dvh - 56px))
        );
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
      font-weight: var(--sui-font-weight-bold);
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
