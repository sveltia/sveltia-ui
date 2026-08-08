<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
  import { onDestroy } from 'svelte';
  import { getOptionRegistry } from '../../services/select.svelte.js';
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
    // svelte-ignore state_referenced_locally
    value = label,
    // svelte-ignore state_referenced_locally
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

  /**
   * The registry provided by an ancestor `<Combobox>`. This is `undefined` when the option is used
   * standalone within a `<Listbox>`, in which case it always renders itself.
   */
  const registry = getOptionRegistry();

  if (registry) {
    // Expose the props as accessors, so the combobox always reads the current values
    const unregister = registry.register({
      /**
       * Get the option’s value.
       * @returns {any} Value.
       */
      get value() {
        return value;
      },
      /**
       * Get the option’s text label.
       * @returns {string} Label.
       */
      get label() {
        return label;
      },
      /**
       * Get the option’s name.
       * @returns {string | undefined} Name.
       */
      get name() {
        return restProps.name;
      },
      /**
       * Get the data type of the option’s value.
       * @returns {string} Type.
       */
      get type() {
        return restProps.valueType ?? typeof value;
      },
      /**
       * Get whether the option is selected.
       * @returns {boolean} Result.
       */
      get selected() {
        return selected;
      },
      /**
       * Select or deselect the option.
       * @param {boolean} newValue `true` to select.
       */
      set selected(newValue) {
        selected = newValue;
      },
      /**
       * Get whether the option is disabled.
       * @returns {boolean} Result.
       */
      get disabled() {
        return disabled;
      },
    });

    onDestroy(unregister);
  }

  /**
   * Whether to render the option. Within a `<Combobox>`, the options are only rendered while the
   * dropdown is expanded; the registration above is what keeps the collapsed combobox working.
   * @type {boolean}
   */
  const rendered = $derived(!registry || registry.expanded);
</script>

{#if rendered}
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
        if (hidden) selected = false;
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
{/if}

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
