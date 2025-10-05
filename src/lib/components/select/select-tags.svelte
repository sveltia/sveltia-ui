<script>
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Option from '../listbox/option.svelte';
  import Select from './select.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {{ label: string, value: any, searchValue?: string }[]} options Available options.
   * @property {string[]} [values] Selected option values.
   * @property {number} [max] Maximum number of selectable options.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onAddValue] Custom `AddValue` event handler.
   * @property {(event: CustomEvent) => void} [onRemoveValue] Custom `RemoveValue` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    values = $bindable([]),
    options,
    max = undefined,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    onAddValue,
    onRemoveValue,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {string | undefined}
   */
  let selectedValue = $state();
</script>

<div role="none" class="sui select-tags {className}" class:disabled={disabled || readonly} {hidden}>
  {#each values as value}
    {@const option = options.find((o) => o.value === value)}
    {#if option}
      <span role="none">
        {option.label}
        <Button
          iconic
          size="small"
          disabled={disabled || readonly}
          aria-label={$_('remove_x', { values: { name: option.label } })}
          onclick={() => {
            values = values.filter((v) => v !== value);
            onRemoveValue?.(new CustomEvent('RemoveValue', { detail: { value } }));
          }}
        >
          {#snippet startIcon()}
            <Icon name="close" />
          {/snippet}
        </Button>
      </span>
    {/if}
  {/each}
  {#if (typeof max !== 'number' || values.length < max) && values.length < options.length}
    <Select
      {...restProps}
      bind:value={selectedValue}
      disabled={disabled || readonly}
      {readonly}
      {required}
      {invalid}
      onChange={() => {
        if (selectedValue) {
          values = [...values, selectedValue];
          onAddValue?.(new CustomEvent('AddValue', { detail: { value: selectedValue } }));
          // Reset the combobox
          selectedValue = undefined;
        }
      }}
    >
      {#each options as { label, value, searchValue } (value)}
        {#if !values.includes(value)}
          <Option {label} {value} {searchValue} />
        {/if}
      {/each}
    </Select>
  {/if}
</div>

<style lang="scss">
  .select-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    &.disabled {
      pointer-events: none;

      & > * {
        opacity: 0.5;
      }
    }

    span {
      display: inline-flex;
      align-items: center;
      margin: var(--sui-focus-ring-width);
      padding: 0;
      padding-inline-start: 8px;
      border-radius: var(--sui-control-medium-border-radius);
      background-color: var(--sui-secondary-background-color);

      :global {
        .icon {
          font-size: var(--sui-font-size-large);
        }
      }
    }
  }
</style>
