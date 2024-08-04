<!--
  @component
  A feedback dialog widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { _ } from 'svelte-i18n';
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
   * The `role` attribute on the `<dialog>` element.
   * @type {'dialog' | 'alertdialog'}
   */
  export let role = 'dialog';
  /**
   * Width of the dialog.
   * @type {('small' | 'medium' | 'large' | 'x-large')}
   */
  export let size = 'medium';
  /**
   * Whether to open the dialog.
   * @type {boolean}
   */
  export let open = false;
  /**
   * Text label displayed on the header. Required.
   * @type {string}
   */
  export let title;
  /**
   * Whether to show the Close button on the header.
   * @type {boolean}
   */
  export let showClose = false;
  /**
   * Whether to show the OK button on the footer.
   * @type {boolean}
   */
  export let showOk = true;
  /**
   * Text label displayed on the OK button.
   * @type {string}
   */
  export let okLabel = '';
  /**
   * Whether to disable the OK button.
   * @type {boolean}
   */
  export let okDisabled = false;
  /**
   * Whether to show the Cancel button on the footer.
   * @type {boolean}
   */
  export let showCancel = true;
  /**
   * Text label displayed on the Cancel button.
   * @type {string}
   */
  export let cancelLabel = '';
  /**
   * Whether to disable the Cancel button.
   * @type {boolean}
   */
  export let cancelDisabled = false;
  /**
   * Whether to close the modal when the backdrop (outside of the modal) is clicked.
   * @type {boolean}
   */
  export let lightDismiss = false;

  /**
   * The ID of the drawer.
   * @type {string}
   */
  const id = generateElementId('dialog');
  /**
   * A reference to the modal component.
   * @type {Modal}
   */
  let modal;
  /**
   * @type {HTMLElement | undefined}
   */
  let content;

  $: {
    if (open && content) {
      /** @type {HTMLElement} */ (content.querySelector('input, button.primary'))?.focus();
    }
  }
</script>

<Modal
  {role}
  {id}
  class="dialog"
  aria-label={$$slots.header ? undefined : title}
  aria-labelledby={$$slots.header ? title : `${id}-title`}
  aria-describedby="{id}-body"
  bind:open
  showBackdrop
  {lightDismiss}
  {...$$restProps}
  bind:this={modal}
  on:opening
  on:open
  on:ok
  on:cancel
  on:closing
  on:close
>
  <slot name="extra-content" slot="extra-content" />
  <div role="none" class="content {className} {size}" bind:this={content}>
    {#if title || showClose || $$slots.header || $$slots['header-extra']}
      <div role="none" class="header">
        {#if $$slots.header}
          <slot name="header" />
        {:else}
          <div role="none" id="{id}-title" class="title">
            {title}
          </div>
          <Spacer flex={true} />
          {#if $$slots['header-extra']}
            <slot name="header-extra" />
          {/if}
          {#if showClose}
            <Button
              variant="ghost"
              iconic
              aria-label={$_('_sui.close')}
              aria-controls={id}
              on:click={() => {
                modal.close('close');
              }}
            >
              <slot name="close-icon" slot="start-icon">
                <Icon name="close" />
              </slot>
            </Button>
          {/if}
        {/if}
      </div>
    {/if}
    <div role="none" id="{id}-body" class="body">
      <slot />
    </div>
    {#if showOk || showCancel || $$slots.footer || $$slots['footer-extra']}
      <div role="none" class="footer">
        {#if $$slots.footer}
          <slot name="footer" />
        {:else}
          {#if $$slots['footer-extra']}
            <slot name="footer-extra" />
          {/if}
          <Spacer flex={true} />
          {#if showOk}
            <Button
              variant="primary"
              label={okLabel || $_('_sui.ok')}
              disabled={okDisabled}
              on:click={() => {
                modal.close('ok');
              }}
            />
          {/if}
          {#if showCancel}
            <Button
              variant="secondary"
              label={cancelLabel || $_('_sui.cancel')}
              disabled={cancelDisabled}
              on:click={() => {
                modal.close('cancel');
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
