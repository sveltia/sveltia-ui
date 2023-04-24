<!--
  @component
  @see https://w3c.github.io/aria/#toolbar
  @see https://w3c.github.io/aria-practices/#toolbar
-->
<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
  let className = '';

  export { className as class };

  /**
   * Define the `aria-orientation` property on the toolbar element.
   * @type {('horizontal'|'vertical')}
   */
  export let orientation = 'horizontal';
</script>

<div
  class="sui toolbar {orientation} {className}"
  role="toolbar"
  aria-orientation={orientation}
  {...$$restProps}
>
  <slot />
</div>

<style lang="scss">
  [role='toolbar'] {
    --toolbar-size: 40px;
    flex: none !important;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;

    &.primary {
      --toolbar-size: 48px;
      background-color: var(--secondary-background-color);
    }

    &.secondary {
      background-color: var(--tertiary-background-color);
    }

    &[aria-orientation='horizontal'] {
      height: var(--toolbar-size);
    }

    &[aria-orientation='vertical'] {
      flex-direction: column;
      width: var(--toolbar-size);
    }

    &:not(:last-child) {
      border-width: 0 0 1px;
      border-color: var(--primary-border-color);
    }

    :global(button[role='button'][aria-pressed='true']),
    :global(button[role='button'][aria-checked='true']) {
      background-color: var(--highlight-background-color);
    }

    :global(h2) {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 0 8px;
      font-size: var(--font-size--large);

      :global(span) {
        font-size: var(--font-size--small);
        font-weight: normal;
        opacity: 0.8;
      }
    }
  }
</style>
