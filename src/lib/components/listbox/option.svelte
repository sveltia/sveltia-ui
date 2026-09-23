<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
  import { onDestroy } from 'svelte';
  import { getOptionRegistry } from '../../services/select.svelte.js';
  import { getValueType } from '../../services/value.js';
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
   * Fallback `id`, so the option can always be referenced by `aria-activedescendant`. `<Group>`
   * assigns one to each member as it activates, but within a `<Combobox>` that happens while the
   * dropdown is still collapsed and no option has rendered yet.
   */
  const fallbackId = $props.id();

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
        return restProps.valueType ?? getValueType(value);
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
      id={restProps.id ?? fallbackId}
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

    &.wrap :global(button) {
      white-space: normal;
    }

    :global {
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

  // The listbox keeps the DOM focus and points at the current option with `aria-activedescendant`,
  // so the `focused` class is the only focus indicator the option gets. The hover background alone
  // is nowhere near 3:1 (WCAG 1.4.11, 2.4.7); the ring is inset so it isn’t clipped by the
  // scrolling list. It follows the listbox’s own `:focus-visible` state, so a click doesn’t paint
  // it while keyboard navigation does, just like the ring on any other control.
  :global([role='listbox']:focus-visible) .option :global(.focused) {
    outline-color: var(--sui-focus-ring-color);
    outline-offset: calc(var(--sui-focus-ring-width) * -1);
  }

  // In a read-only listbox, the check mark is drawn in a neutral colour and pointing at an option
  // gives no feedback, so it doesn’t look editable. The keyboard cursor keeps its highlight.
  :global([role='listbox'][aria-readonly='true']) .option {
    :global {
      button {
        cursor: default;

        &:not(.focused):is(:hover, :active) {
          color: var(--sui-control-foreground-color);
          background-color: transparent;
        }

        &[aria-selected='true'] .icon.check {
          color: var(--sui-readonly-accent-color);
        }
      }
    }
  }
</style>
