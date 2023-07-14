<!--
  @component
  Inline alert message.
  @see https://w3c.github.io/aria/#alert
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
-->
<script>
  import Icon from '../icon/icon.svelte';

  /**
   * Alert type.
   * @type {'error' | 'warning' | 'info' | 'success'}
   */
  export let type = 'error';
</script>

<div class="sui alert {type}" role="alert" {...$$restProps}>
  {#if $$slots.icon}
    <slot name="icon" />
  {:else}
    <Icon name={type === 'success' ? 'check_circle' : type} />
  {/if}
  <slot />
</div>

<style lang="scss">
  .alert {
    display: flex;
    align-items: center;
    gap: var(--gap, 8px);
    padding: var(--padding, 8px);
    border-width: var(--border-width, var(--control--medium--border-width));
    border-style: var(--border-style, solid);
    border-radius: var(--border-radius, var(--control--medium--border-radius));
    font-size: var(--font-size, var(--font-size--default));

    &.error {
      border-color: var(--error-border-color);
      color: var(--error-foreground-color);
      background-color: var(--error-background-color);
    }

    &.warning {
      border-color: var(--warning-border-color);
      color: var(--warning-foreground-color);
      background-color: var(--warning-background-color);
    }

    &.info {
      border-color: var(--info-border-color);
      color: var(--info-foreground-color);
      background-color: var(--info-background-color);
    }

    &.success {
      border-color: var(--success-border-color);
      color: var(--success-foreground-color);
      background-color: var(--success-background-color);
    }
  }
</style>
