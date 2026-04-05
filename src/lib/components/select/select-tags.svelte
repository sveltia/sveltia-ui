<script>
  import { _, isRTL } from '@sveltia/i18n';
  import { tick } from 'svelte';
  import { flip } from 'svelte/animate';
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
   * @property {(event: CustomEvent<{ value: string }>) => void} [onAddValue] Custom `AddValue`
   * event handler.
   * @property {(event: CustomEvent<{ value: string }>) => void} [onRemoveValue] Custom
   * `RemoveValue` event handler.
   * @property {(event: CustomEvent<{ values: string[] }>) => void} [onReorder] Custom `Reorder`
   * event handler fired when the order of selected values changes.
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
    onReorder,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {Map<any, { label: string, value: any, searchValue?: string }>} */
  const optionMap = $derived(new Map(options.map((o) => [o.value, o])));
  const prevKey = $derived(isRTL() ? 'ArrowRight' : 'ArrowLeft');
  const nextKey = $derived(isRTL() ? 'ArrowLeft' : 'ArrowRight');

  /**
   * Reference to the wrapper element.
   * @type {HTMLElement | undefined}
   */
  let wrapperElement = $state();

  /**
   * @type {string | undefined}
   */
  let selectedValue = $state();

  /**
   * Index of the tag currently being dragged.
   * @type {number | undefined}
   */
  let dragIndex = $state();

  /**
   * Insertion position during drag: the dragged item will be placed *before* this index (0 = before
   * first, values.length = after last).
   * @type {number | undefined}
   */
  let dropIndex = $state();

  /**
   * Move a selected value from one position to another and dispatch the `Reorder` event.
   * @param {number} from Source index.
   * @param {number} to Destination index.
   */
  const moveValue = (from, to) => {
    if (from === to) return;

    const newValues = [...values];
    const [item] = newValues.splice(from, 1);

    newValues.splice(to, 0, item);
    values = newValues;
    onReorder?.(new CustomEvent('Reorder', { detail: { values: newValues } }));
  };

  /**
   * Move a value and focus the tag at the destination index.
   * @param {number} from Source index.
   * @param {number} to Destination index.
   */
  const moveAndFocus = async (from, to) => {
    moveValue(from, to);
    await tick();

    /** @type {HTMLElement} */ (
      wrapperElement?.querySelectorAll('.label[tabindex]')?.[to]
    )?.focus();
  };
</script>

<div
  role="none"
  class="sui select-tags {className}"
  class:disabled={disabled || readonly}
  {hidden}
  bind:this={wrapperElement}
>
  <span
    role="listbox"
    aria-multiselectable="true"
    aria-label={_('_sui.select_tags.selected_options')}
  >
    {#each values as value, index (value)}
      {@const option = optionMap.get(value)}
      {@const label = option?.label || option?.value || value}
      <span
        role="none"
        draggable={!disabled && !readonly}
        class:drag-source={dragIndex === index}
        class:drop-before={dropIndex === index && dragIndex !== index && dragIndex !== index - 1}
        class:drop-after={dropIndex === values.length &&
          index === values.length - 1 &&
          dragIndex !== values.length - 1}
        ondragstart={(event) => {
          dragIndex = index;

          if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', label);
            event.dataTransfer.effectAllowed = 'move';
          }
        }}
        ondragover={(event) => {
          event.preventDefault();

          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
          }

          const rect = event.currentTarget.getBoundingClientRect();
          const inFirstHalf = event.clientX < rect.left + rect.width / 2;

          dropIndex = inFirstHalf !== isRTL() ? index : index + 1;
        }}
        ondrop={async (event) => {
          event.preventDefault();

          const fromIndex = dragIndex;
          const toIndex = dropIndex;

          dragIndex = undefined;
          dropIndex = undefined;

          if (
            fromIndex !== undefined &&
            toIndex !== undefined &&
            toIndex !== fromIndex &&
            toIndex !== fromIndex + 1
          ) {
            await moveAndFocus(fromIndex, toIndex > fromIndex ? toIndex - 1 : toIndex);
          }
        }}
        ondragend={() => {
          dragIndex = undefined;
          dropIndex = undefined;
        }}
        animate:flip={{ duration: 200 }}
      >
        <span
          class="label"
          role="option"
          aria-selected="true"
          tabindex={disabled || readonly ? undefined : 0}
          onkeydown={async (event) => {
            const { key } = event;

            const targetIndex =
              key === prevKey && index > 0
                ? index - 1
                : key === nextKey && index < values.length - 1
                  ? index + 1
                  : key === 'Home' && index > 0
                    ? 0
                    : key === 'End' && index < values.length - 1
                      ? values.length - 1
                      : -1;

            if (targetIndex === -1) return;

            event.preventDefault();
            await moveAndFocus(index, targetIndex);
          }}
        >
          {label}
        </span>
        {#if option}
          <Button
            iconic
            size="small"
            disabled={disabled || readonly}
            aria-label={_('_sui.select_tags.remove_x', { values: { name: label } })}
            onclick={() => {
              values = values.filter((v) => v !== value);
              onRemoveValue?.(new CustomEvent('RemoveValue', { detail: { value } }));
            }}
          >
            {#snippet startIcon()}
              <Icon name="close" />
            {/snippet}
          </Button>
        {/if}
      </span>
    {/each}
  </span>
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

    span[role='listbox'] {
      display: contents;
    }

    span[draggable] {
      display: inline-flex;
      align-items: center;
      position: relative;
      margin: var(--sui-focus-ring-width);
      padding: 0;
      padding-inline-start: 8px;
      border-radius: var(--sui-control-medium-border-radius);
      background-color: var(--sui-secondary-background-color);
      cursor: grab;
      outline: none;

      &:focus-within {
        outline: var(--sui-focus-ring-width) solid var(--sui-primary-accent-color-translucent);
        outline-offset: 1px;
      }

      &.drag-source {
        opacity: 0.4;
        cursor: grabbing;
      }

      &.drop-before::before,
      &.drop-after::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        margin-left: -1px;
        border-radius: 1px;
        width: 4px;
        background-color: var(--sui-primary-accent-color);
        pointer-events: none;
      }

      &.drop-before::before {
        inset-inline-start: calc(-1 * var(--sui-focus-ring-width) - 1px);
      }

      &.drop-after::after {
        inset-inline-end: calc(-1 * var(--sui-focus-ring-width) - 1px);
      }

      .label {
        outline: none;
      }

      :global {
        .icon {
          font-size: var(--sui-font-size-large);
        }
      }
    }
  }
</style>
