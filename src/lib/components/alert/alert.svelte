<!--
  @component
  Inline alert message.
  @see https://w3c.github.io/aria/#alert
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
-->
<script>
  import { _ } from '@sveltia/i18n';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {'error' | 'warning' | 'info' | 'success'} status Alert status. Errors and warnings
   * are `role="alert"` and interrupt; information and success are `role="status"` and wait.
   * @property {'off' | 'polite' | 'assertive'} [ariaLive] ARIA live region politeness. Defaults to
   * `assertive` for an alert and `polite` for a status.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [icon] Icon slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    status,
    ariaLive = undefined,
    children,
    icon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const role = $derived(status === 'error' || status === 'warning' ? 'alert' : 'status');
</script>

<!--
  The colour and icon tell sighted users how serious the message is; the icon is hidden from
  assistive technology, so the status is also spelled out for screen readers, off screen.
-->
<div
  {...restProps}
  {role}
  class="sui alert {status}"
  aria-live={ariaLive ?? (role === 'alert' ? 'assertive' : 'polite')}
>
  {#if icon}
    {@render icon()}
  {:else}
    <Icon name={status === 'success' ? 'check_circle' : status} />
  {/if}
  <span class="status-label">{_(`_sui.alert.${status}`)}</span>
  {@render children?.()}
</div>

<style lang="scss">
  .status-label {
    position: absolute;
    overflow: hidden;
    clip-path: inset(50%);
    width: 1px;
    height: 1px;
    white-space: nowrap;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: var(--gap, 8px);
    padding: var(--padding, 8px);
    border-width: var(--border-width, var(--sui-control-medium-border-width));
    border-style: var(--border-style, solid);
    border-radius: var(--border-radius, var(--sui-control-medium-border-radius));
    font-size: var(--font-size, var(--sui-font-size-default));

    &.error {
      border-color: var(--sui-error-border-color);
      color: var(--sui-error-foreground-color);
      background-color: var(--sui-error-background-color);
    }

    &.warning {
      border-color: var(--sui-warning-border-color);
      color: var(--sui-warning-foreground-color);
      background-color: var(--sui-warning-background-color);
    }

    &.info {
      border-color: var(--sui-info-border-color);
      color: var(--sui-info-foreground-color);
      background-color: var(--sui-info-background-color);
    }

    &.success {
      border-color: var(--sui-success-border-color);
      color: var(--sui-success-foreground-color);
      background-color: var(--sui-success-background-color);
    }
  }
</style>
