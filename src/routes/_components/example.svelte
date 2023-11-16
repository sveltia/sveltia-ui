<script>
  import { getRandomId } from '$lib';

  const id = getRandomId('example');
</script>

<div role="figure" aria-labelledby="{id}-title">
  <div role="caption" id="{id}-title">Preview</div>
  <div role="none" class="body">
    <slot />
  </div>
</div>

<style lang="scss">
  [role='figure'] {
    margin: 16px 0;
    padding: 16px;
    border-width: 1px 1px 1px 8px;
    border-style: solid;
    border-color: var(--sui-info-border-color);
    background-color: var(--sui-info-background-color);
    border-radius: var(--sui-control-medium-border-radius);

    [role='caption'] {
      color: var(--sui-info-foreground-color);
    }

    .body {
      margin: 16px 0 0;

      > :global(div:not(:first-child)) {
        margin: 8px 0 0;
      }
    }
  }
</style>
