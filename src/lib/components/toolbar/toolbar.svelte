<!--
  @component
  A toolbar layout that can contain `<Button>`, `<Select>` and other widgets.
  @see https://w3c.github.io/aria/#toolbar
  @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {'horizontal' | 'vertical'} [orientation] Orientation of the widget. An alias of the
   * `aria-orientation` attribute.
   * @property {'primary' | 'secondary'} [variant] The style variant of the toolbar.
   * @property {Snippet} [children] Primary slot content.
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
  class="sui toolbar {orientation} {variant} {className}"
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
    padding-inline: 8px;
    background-color: var(--toolbar-background-color, transparent);

    &.primary {
      --toolbar-size: var(--sui-primary-toolbar-size);
    }

    &.secondary {
      @media (width < 768px) {
        padding-inline: 0;
      }
    }

    &[aria-orientation='horizontal'] {
      height: var(--toolbar-size);
    }

    &[aria-orientation='vertical'] {
      flex-direction: column;
      width: var(--toolbar-size);
    }

    :global {
      button[role='button']:is([aria-pressed='true'], [aria-checked='true']) {
        background-color: var(--sui-selected-background-color);
      }

      h2 {
        flex: none;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding-inline-end: 12px;
        min-width: 0;
        font-size: var(--sui-font-size-x-large);

        &:first-child {
          padding-inline-start: 12px;
        }

        span:not(.sui.truncated-text) {
          font-size: var(--sui-font-size-small);
          font-weight: var(--sui-font-weight-normal, normal);
          opacity: 0.8;
        }
      }

      .divider {
        &[aria-orientation='horizontal'] {
          margin: 0 4px;
          width: calc(100% - 8px);
        }

        &[aria-orientation='vertical'] {
          margin: 4px 0;
          height: calc(100% - 8px);
        }
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
