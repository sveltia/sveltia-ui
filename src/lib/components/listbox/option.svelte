<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ButtonProps, CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [selected] Whether to select the widget. An alias of the `aria-selected`
   * attribute.
   * @property {string} label Text label displayed on the item.
   * @property {string} [searchValue] The value to be searched.
   * @property {boolean} [wrap] Whether to wrap a long label.
   * @property {Snippet} [checkIcon] Check icon slot content.
   */

  /**
   * @type {ButtonProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    selected = $bindable(false),
    hidden = $bindable(false),
    class: className,
    disabled = false,
    label,
    value = label,
    searchValue = label,
    wrap = false,
    children,
    checkIcon,
    startIcon: _startIcon,
    onChange,
    onToggle,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div role="none" class="sui option {className}" class:wrap {hidden}>
  <Button
    {...restProps}
    role="option"
    tabindex="-1"
    aria-selected={selected}
    {label}
    {value}
    {hidden}
    {disabled}
    data-search-value={searchValue}
    onChange={(event) => {
      selected = event.detail.selected;
      onChange?.(event);
    }}
    onToggle={(event) => {
      hidden = event.detail.hidden;
      selected = false;
      onToggle?.(event);
    }}
  >
    {#if selected}
      {#if checkIcon}
        {@render checkIcon()}
      {:else}
        <Icon class="check" name="check" />
      {/if}
    {/if}
    {#snippet startIcon()}
      {@render _startIcon?.()}
    {/snippet}
    {@render children?.()}
  </Button>
</div>

<style lang="scss">
  .option {
    display: contents;

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global {
      &.wrap button {
        white-space: normal;
      }

      button {
        flex: none;
        display: flex;
        gap: 4px;
        margin: 0 !important;
        border-radius: var(--sui-option-border-radius);
        padding: var(--sui-option-padding);
        width: 100%;
        height: auto;
        min-height: var(--sui-option-height);

        &:active {
          background-color: var(--sui-active-background-color);
        }

        &[aria-selected='true'] {
          .icon.check {
            color: var(--sui-primary-accent-color-text);
          }
        }

        * {
          flex: none;
        }

        .label {
          flex: auto;
        }
      }

      :is(.focused, button:hover) {
        color: var(--sui-highlight-foreground-color);
        background-color: var(--sui-hover-background-color);
      }

      .icon.check {
        margin: -2px;
      }
    }
  }
</style>
