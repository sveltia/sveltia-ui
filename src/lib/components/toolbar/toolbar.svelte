<!--
  @component
  A toolbar layout that can contain `<Button>`, `<Select>` and other widgets.
  @see https://w3c.github.io/aria/#toolbar
  @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {'horizontal' | 'vertical'} [orientation] - Orientation of the widget. An alias of
   * the `aria-orientation` attribute.
   * @property {'primary' | 'secondary' | undefined} [variant] - The style variant of the toolbar.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    orientation = 'horizontal',
    variant = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="toolbar"
  class="sui toolbar {orientation} {variant ?? ''} {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-orientation={orientation}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  [role='toolbar'] {
    --toolbar-size: var(--sui-secondary-toolbar-size);
    flex: none !important;
    display: flex;
    align-items: center;
    padding: 0 4px;

    &.primary {
      --toolbar-size: var(--sui-primary-toolbar-size);
      border-color: var(--sui-primary-border-color);
      background-color: var(--sui-secondary-background-color);
    }

    &.secondary {
      background-color: var(--sui-tertiary-background-color);
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
      border-color: var(--sui-primary-border-color);
    }

    :global(button[role='button'][aria-pressed='true']),
    :global(button[role='button'][aria-checked='true']) {
      background-color: var(--sui-selected-background-color);
    }

    :global(h2) {
      flex: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 0 8px;
      min-width: 0;
      font-size: var(--sui-font-size-large);

      :global(strong) {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :global(span) {
        font-size: var(--sui-font-size-small);
        font-weight: var(--sui-font-weight-normal, normal);
        opacity: 0.8;
      }
    }

    :global(.divider[aria-orientation='horizontal']) {
      margin: 0 4px;
      width: calc(100% - 8px);
    }

    :global(.divider[aria-orientation='vertical']) {
      margin: 4px 0;
      height: calc(100% - 8px);
    }
  }

  .inner {
    display: contents;
  }
</style>
