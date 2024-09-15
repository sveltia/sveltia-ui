<!--
  @component
  Inline alert message.
  @see https://w3c.github.io/aria/#alert
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
-->
<script>
  import Icon from '../icon/icon.svelte';

  /**
   * @typedef {object} Props
   * @property {'error' | 'warning' | 'info' | 'success'} status - Alert status.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {import('svelte').Snippet} [icon] - Icon slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    status,
    children,
    icon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="alert" class="sui alert {status}">
  {#if icon}
    {@render icon()}
  {:else}
    <Icon name={status === 'success' ? 'check_circle' : status} />
  {/if}
  {@render children?.()}
</div>

<style lang="scss">
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
