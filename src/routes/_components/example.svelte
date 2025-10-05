<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {Snippet} [children] Primary slot content.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    children,
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
</script>

<div role="figure" aria-labelledby="{id}-title">
  <div role="caption" id="{id}-title">Preview</div>
  <div role="none" class="body">
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  [role='figure'] {
    margin: 16px 0;
    padding: 16px;
    border-block-start-width: 1px;
    border-block-end-width: 1px;
    border-inline-end-width: 1px;
    border-inline-start-width: 8px;
    border-style: solid;
    border-color: var(--sui-info-border-color);
    background-color: var(--sui-info-background-color);
    border-radius: var(--sui-control-medium-border-radius);

    [role='caption'] {
      color: var(--sui-info-foreground-color);
    }

    .body {
      margin: 16px 0 0;

      :global {
        & > div:not(:first-child) {
          margin: 8px 0 0;
        }
      }
    }
  }
</style>
