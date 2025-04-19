<!--
  @component
  A tab list widget.
  @see https://w3c.github.io/aria/#tablist
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  import { onMount } from 'svelte';
  import { activateGroup } from '../../services/group.svelte';

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
   * @property {string} [name] The `data-name` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
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
    name = undefined,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * A reference to the wrapper element.
   * @type {HTMLElement | undefined}
   */
  let wrapper = $state();
  /**
   * The indicator’s CSS style.
   * @type {string | undefined}
   */
  let indicatorStyle = $state();

  /**
   * Update the indicator position.
   */
  const updateIndicator = () => {
    globalThis.requestAnimationFrame(() => {
      const selected = /** @type {HTMLElement | null} */ (
        wrapper?.querySelector('[role="tab"][aria-selected="true"]')
      );

      if (selected) {
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = selected;

        indicatorStyle = Object.entries({
          top: offsetTop,
          left: offsetLeft,
          width: offsetWidth,
          height: offsetHeight,
        })
          .map(([key, value]) => `${key}: ${value}px`)
          .join('; ');
      } else {
        indicatorStyle = undefined;
      }
    });
  };

  onMount(() => {
    const observer = new ResizeObserver(() => {
      updateIndicator();
    });

    observer.observe(/** @type {HTMLElement} */ (wrapper));

    return () => {
      observer.disconnect();
    };
  });
</script>

<div
  bind:this={wrapper}
  {...restProps}
  role="tablist"
  class="sui tab-list {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-orientation={orientation}
  data-name={name || undefined}
  onInitialized={() => {
    updateIndicator();
  }}
  onChange={(/** @type {CustomEvent} */ event) => {
    updateIndicator();
    onChange?.(event);
  }}
  use:activateGroup
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
  <div role="none" class="indicator" style={indicatorStyle}></div>
</div>

<style lang="scss">
  .tab-list {
    flex: none;
    position: relative;
    display: flex;
    align-items: center;
    margin: var(--sui-tab-list-margin, var(--sui-focus-ring-width));
    border-color: var(--sui-tab-list-border-color, var(--sui-control-border-color));
    border-radius: var(--sui-tab-list-border-radius, 0);
    background-color: var(--sui-tab-list-background-color, transparent);

    &[aria-orientation='horizontal'] {
      gap: var(--sui-horizontal-tab-list-gap, var(--sui-tab-list-gap, 8px));
      margin: var(--sui-horizontal-tab-list-margin, var(--sui-tab-list-margin, 0 0 32px));
      border-width: var(
        --sui-horizontal-tab-list-border-width,
        var(--sui-tab-list-border-width, 0 0 1px)
      );
      padding: var(--sui-horizontal-tab-list-padding, var(--sui-tab-list-padding, 0 16px));

      :global {
        button {
          width: var(--sui-horizontal-tab-width, var(--sui-tab-width, auto));
          height: var(--sui-horizontal-tab-height, var(--sui-tab-height, 100%));
          justify-content: var(--sui-horizontal-tab-justify-content, center);
        }
      }

      .indicator {
        border-width: var(
          --sui-horizontal-tab-list-indicator-border-width,
          var(--sui-tab-list-indicator-border-width, 0 0 2px 0)
        );
      }
    }

    &[aria-orientation='vertical'] {
      gap: var(--sui-vertical-tab-list-gap, var(--sui-tab-list-gap, 8px));
      flex-direction: column;
      margin: var(--sui-vertical-tab-list-margin, var(--sui-tab-list-margin, 0 32px 0 0));
      border-width: var(
        --sui-vertical-tab-list-border-width,
        var(--sui-tab-list-border-width, 0 1px 0 0)
      );
      padding: var(--sui-vertical-tab-list-padding, var(--sui-tab-list-padding, 8px 0));
      width: var(--sui-vertical-tab-list-width, auto);

      :global {
        button {
          justify-content: var(--sui-vertical-tab-justify-content, flex-start);
          padding-right: 32px;
          width: var(--sui-vertical-tab-width, var(--sui-tab-width, 100%));
          height: var(--sui-vertical-tab-height, var(--sui-tab-height, auto));
        }
      }

      .indicator {
        border-width: var(
          --sui-horizontal-tab-list-vertical-border-width,
          var(--sui-tab-list-indicator-border-width, 0 2px 0 0)
        );
      }
    }

    :global {
      button {
        position: relative;
        z-index: 1;
        border-color: transparent;
        margin: 0 !important;
        border-radius: var(--sui-tab-border-radius, 0);
        font-family: var(--sui-tab-font-family, var(--sui-control-font-family, inherit));
        font-size: var(--sui-tab-font-size, var(--sui-control-font-size, inherit));
        font-weight: var(
          --sui-tab-font-weight,
          var(--sui-control-font-weight, var(--sui-font-weight-normal, normal))
        );
      }
    }
  }

  .inner {
    display: contents;
  }

  .indicator {
    position: absolute;
    z-index: 0;
    inset: auto;
    border-radius: var(--sui-tab-list-indicator-border-radius, 0);
    border-color: var(--sui-tab-list-indicator-border-color, var(--sui-primary-accent-color-light));
    background-color: var(--sui-tab-list-indicator-background-color, transparent);
    box-shadow: var(--sui-tab-list-indicator-box-shadow, none);
    pointer-events: none;
    transition: var(--sui-tab-list-indicator-transition, all 200ms);
  }
</style>
