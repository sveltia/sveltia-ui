<!--
  @component
  A feedback dialog widget based on the HTML `<dialog>` element.
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
  const id = getRandomId('dialog');
  /**
   * a reference to the modal component.
   * @type {Modal}
   */
  let modal;
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
>
  <div role="none" class="content {className} {size}">
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
              <Icon slot="start-icon" name="close" />
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
    border-radius: 4px;
    max-width: calc(100vw - 32px);
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
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
      width: 400px;
      max-height: 400px;

      @media (max-height: 400px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.medium {
      width: 600px;
      max-height: 600px;

      @media (max-height: 600px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.large {
      width: 800px;
      max-height: 800px;

      @media (max-height: 800px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.x-large {
      width: 1000px;
      max-height: 1000px;

      @media (max-height: 1000px) {
        max-height: calc(100vh - 32px);
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

  .body {
    overflow: auto;
    margin: 24px 24px;
    white-space: normal;
    line-height: var(--sui-line-height-compact);
  }
</style>
