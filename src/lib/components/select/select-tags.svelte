<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from '$lib/components/button/button.svelte';
  import Icon from '$lib/components/icon/icon.svelte';
  import Option from '$lib/components/listbox/option.svelte';
  import Select from '$lib/components/select/select.svelte';

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
   * Whether to make the widget read-only. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Available options.
   * @type {{ label: string, value: string, searchValue?: string }[]}
   */
  export let options;
  /**
   * Selected option values.
   * @type {string[]}
   */
  export let values = [];
  /**
   * Maximum number of selectable options.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * @type {string | undefined}
   */
  let selectedValue = undefined;

  const dispatch = createEventDispatcher();
</script>

<div
  role="none"
  class="sui select-tags {className}"
  class:disabled={disabled || readonly}
  hidden={hidden || undefined}
>
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
          on:click={() => {
            values = values.filter((v) => v !== value);
            dispatch('RemoveValue', { value });
          }}
        >
          <Icon slot="start-icon" name="close" />
        </Button>
      </span>
    {/if}
  {/each}
  {#if (typeof max !== 'number' || values.length < max) && values.length < options.length}
    <Select
      disabled={disabled || readonly}
      {readonly}
      {required}
      {invalid}
      {...$$restProps}
      bind:value={selectedValue}
      on:change={() => {
        if (selectedValue) {
          values = [...values, selectedValue];
          dispatch('AddValue', { value: selectedValue });
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
      padding: 0 0 0 8px;
      border-radius: var(--sui-control-medium-border-radius);
      background-color: var(--sui-secondary-background-color);

      :global(.icon) {
        font-size: var(--sui-font-size-large);
      }
    }
  }
</style>
