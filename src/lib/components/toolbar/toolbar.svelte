<!--
  @component
  A toolbar layout that can contain `<Button>`, `<Select>` and other widgets.
  @see https://w3c.github.io/aria/#toolbar
  @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Orientation of the widget. An alias of the `aria-orientation` attribute.
   * @type {'horizontal' | 'vertical'}
   */
  export let orientation = 'horizontal';
  /**
   * The style variant of the toolbar.
   * @type {'primary' | 'secondary' | undefined}
   */
  export let variant = undefined;
</script>

<div
  role="toolbar"
  class="sui toolbar {orientation} {variant ?? ''} {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-orientation={orientation}
  {...$$restProps}
>
  <div role="none" class="inner" inert={disabled}>
    <slot />
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
        font-weight: normal;
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
