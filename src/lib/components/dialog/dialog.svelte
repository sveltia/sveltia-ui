<!--
  @component
  A feedback dialog widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { sleep } from '@sveltia/utils/misc';
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';
  import Modal from '../util/modal.svelte';

  /**
   * @type {import('$lib/typedefs').ModalProps & import('$lib/typedefs').DialogProps &
   * Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    value = $bindable(''),
    title,
    role = 'dialog',
    size = 'medium',
    class: className,
    showClose = false,
    showOk = true,
    showCancel = true,
    okLabel = '',
    okDisabled = false,
    cancelLabel = '',
    cancelDisabled = false,
    children,
    header,
    headerExtra,
    footer,
    footerExtra,
    closeIcon,
    input: _input,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * The ID of the drawer.
   * @type {string}
   */
  const id = generateElementId('dialog');
  /**
   * A reference to the modal component.
   * @type {any}
   */
  let modal = $state();
  /**
   * @type {HTMLElement | undefined}
   */
  let content = $state();

  $effect(() => {
    if (open && content) {
      (async () => {
        await sleep(50);
        /** @type {HTMLInputElement | HTMLButtonElement} */ (
          content?.querySelector('input, button.primary')
        )?.focus();
        /** @type {HTMLInputElement} */ (content?.querySelector('input'))?.select();
      })();
    }
  });
</script>

<Modal
  bind:this={modal}
  {...restProps}
  {role}
  {id}
  class="dialog"
  aria-label={header ? undefined : title}
  aria-labelledby={header ? title : `${id}-title`}
  aria-describedby="{id}-body"
  bind:open
  showBackdrop
>
  <div bind:this={content} role="none" class="content {className} {size}">
    {#if title || showClose || header || headerExtra}
      <div role="none" class="header">
        {#if header}
          {@render header()}
        {:else}
          <div role="none" id="{id}-title" class="title">
            {title}
          </div>
          <Spacer flex={true} />
          {@render headerExtra?.()}
          {#if showClose}
            <Button
              variant="ghost"
              iconic
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
        {/if}
      </div>
    {/if}
    <div role="none" id="{id}-body" class="body">
      {@render children?.()}
    </div>
    {#if showOk || showCancel || footer || footerExtra}
      <div role="none" class="footer">
        {#if footer}
          {@render footer?.()}
        {:else}
          {@render footerExtra?.()}
          <Spacer flex={true} />
          {#if showOk}
            <Button
              variant="primary"
              label={okLabel || $_('_sui.ok')}
              disabled={okDisabled}
              onclick={() => {
                modal?.close('ok');
              }}
            />
          {/if}
          {#if showCancel}
            <Button
              variant="secondary"
              label={cancelLabel || $_('_sui.cancel')}
              disabled={cancelDisabled}
              onclick={() => {
                modal?.close('cancel');
              }}
            />
          {/if}
        {/if}
      </div>
    {/if}
  </div>
</Modal>

<style lang="scss">
  .content {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--sui-dialog-content-border-radius, 4px);
    max-width: calc(100dvw - var(--sui-dialog-content-margin, 16px) * 2);
    background-color: var(
      --sui-dialog-content-background-color,
      var(--sui-secondary-background-color-translucent)
    );
    box-shadow: var(--sui-dialog-content-box-shadow, 0 8px 16px var(--sui-popup-shadow-color));
    -webkit-backdrop-filter: var(--sui-dialog-content-backdrop-filter, blur(16px));
    backdrop-filter: var(--sui-dialog-content-backdrop-filter, blur(16px));
    transition-property: transform;

    :global(dialog.open) & {
      transition-duration: 150ms;
      transform: scale(100%);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
      transform: scale(90%);
    }

    &.small {
      width: var(--sui-dialog-small-content-width, var(--sui-dialog-content-width, 400px));
      max-height: var(
        --sui-dialog-small-content-max-height,
        var(--sui-dialog-content-max-height, 400px)
      );

      @media (max-height: 400px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.medium {
      width: var(--sui-dialog-medium-content-width, var(--sui-dialog-content-width, 600px));
      max-height: var(
        --sui-dialog-medium-content-max-height,
        var(--sui-dialog-content-max-height, 600px)
      );

      @media (max-height: 600px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.large {
      width: var(--sui-dialog-large-content-width, var(--sui-dialog-content-width, 800px));
      max-height: var(
        --sui-dialog-large-content-max-height,
        var(--sui-dialog-content-max-height, 800px)
      );

      @media (max-height: 800px) {
        max-height: calc(100dvh - 32px);
      }
    }

    &.x-large {
      width: var(--sui-dialog-x-large-content-width, var(--sui-dialog-content-width, 1000px));
      max-height: var(
        --sui-dialog-x-large-content-max-height,
        var(--sui-dialog-content-max-height, 1000px)
      );

      @media (max-height: 1000px) {
        max-height: calc(100dvh - 32px);
      }
    }
  }

  .header,
  .footer {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header {
    box-sizing: content-box;
    margin: var(--sui-dialog-header-margin, 0 16px);
    border-width: var(--sui-dialog-header-border-width, 0 0 1px);
    border-color: var(--sui-dialog-header-border-color, var(--sui-secondary-border-color));
    padding: var(--sui-dialog-header-padding, 16px 8px);
    height: var(--sui-dialog-header-height, 32px);

    .title {
      font-size: var(--sui-font-size-large);
    }
  }

  .footer {
    margin: var(--sui-dialog-footer-margin, 0 24px 24px);
  }

  .body {
    overflow: auto;
    margin: var(--sui-dialog-body-margin, 24px 24px);
    white-space: normal;
    line-height: var(--sui-line-height-compact);
  }
</style>
