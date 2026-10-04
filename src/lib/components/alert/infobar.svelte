<script>
  import { _ } from '@sveltia/i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import AlertContent from './alert-content.svelte';
  import { getAlertAriaLive, getAlertRole } from './alert.js';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [show] Whether to show the infobar.
   * @property {boolean} [dismissible] Whether to show the close button.
   * @property {'error' | 'warning' | 'info' | 'success'} [status] Information status. Errors and
   * warnings are `role="alert"` and interrupt; information and success are `role="status"` and
   * wait.
   * @property {'off' | 'polite' | 'assertive'} [ariaLive] ARIA live region politeness. Defaults to
   * `assertive` for an alert and `polite` for a status.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [icon] Icon slot content.
   * @property {() => void} [onDismiss] Callback invoked when the close button is clicked.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    show = $bindable(true),
    dismissible = true,
    status = 'info',
    ariaLive = undefined,
    children = undefined,
    icon = undefined,
    onDismiss,
    /* eslint-enable prefer-const */
  } = $props();

  const role = $derived(getAlertRole(status));
</script>

{#if show}
  <div role="none" class={['infobar', status]}>
    <div {role} class="message" aria-live={getAlertAriaLive(role, ariaLive)}>
      <AlertContent {status} {children} {icon} />
    </div>
    {#if dismissible}
      <div role="none">
        <Button
          iconic
          size="small"
          variant="ghost"
          aria-label={_('_sui.dismiss')}
          onclick={() => {
            show = false;
            onDismiss?.();
          }}
        >
          <Icon name="close" />
        </Button>
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .infobar {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--sui-infobar-gap, 8px);
    border-width: var(--sui-infobar-border-width, 0 0 1px);
    border-style: var(--sui-infobar-border-style, solid);
    padding: var(--sui-infobar-padding, 0);
    min-height: var(--sui-infobar-min-height, 32px);
    font-size: var(--sui-infobar-font-size, var(--sui-font-size-small));

    &.info {
      border-color: var(--sui-info-border-color);
      color: var(--sui-info-foreground-color);
      background-color: var(--sui-info-background-color);
    }

    &.warning {
      border-color: var(--sui-warning-border-color);
      color: var(--sui-warning-foreground-color);
      background-color: var(--sui-warning-background-color);
    }

    &.error {
      border-color: var(--sui-error-border-color);
      color: var(--sui-error-foreground-color);
      background-color: var(--sui-error-background-color);
    }

    &.success {
      border-color: var(--sui-success-border-color);
      color: var(--sui-success-foreground-color);
      background-color: var(--sui-success-background-color);
    }
  }

  .message {
    flex: auto;
    display: flex;
    align-items: center;
    justify-content: var(--sui-infobar-message-justify-content, start);
    gap: var(--sui-infobar-message-gap, 6px);
    padding: var(--sui-infobar-message-padding, 6px);

    :global {
      button {
        font-size: inherit !important;
      }

      .icon {
        font-size: 16px; /* !hardcoded */
      }
    }
  }
</style>
