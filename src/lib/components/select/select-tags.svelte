<script>
  import { _, isRTL } from '@sveltia/i18n';
  import { tick } from 'svelte';
  import { flip } from 'svelte/animate';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Option from '../listbox/option.svelte';
  import Select from './select.svelte';
  import { getDropIndex, getDropTarget, getKeyboardMoveTarget, moveItem } from './select-tags.js';

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
  /**
   * The selected values as a set, so the option list below can test membership in constant time.
   * Calling `values.includes()` once per option instead makes rendering the list quadratic in the
   * number of options and selected tags.
   * @type {Set<any>}
   */
  const selectedValues = $derived(new Set(values));

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
    // The callers only ask for actual moves
    /* v8 ignore next */
    if (from === to) return;

    const newValues = moveItem(values, from, to);

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
  <!--
    The tags follow the APG layout grid pattern rather than a listbox: a listbox may only hold
    options, and each tag also carries its Remove button. Each tag is a row whose first cell, the
    label, is the focusable part that the arrow keys reorder.
    @see https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/
  -->
  <span role="grid" aria-label={_('_sui.select_tags.selected_options')}>
    {#each values as value, index (value)}
      {@const option = optionMap.get(value)}
      {@const label = option?.label || option?.value || value}
      <!--
        The drag handlers are the pointer path only; the keyboard path is the focusable label cell
        below, so the row itself stays out of the tab order
      -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <span
        role="row"
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

          dropIndex = getDropIndex({
            index,
            clientX: event.clientX,
            rect: event.currentTarget.getBoundingClientRect(),
            rtl: isRTL(),
          });
        }}
        ondrop={async (event) => {
          event.preventDefault();

          const fromIndex = dragIndex;
          const toIndex = dropIndex;

          dragIndex = undefined;
          dropIndex = undefined;

          if (fromIndex === undefined || toIndex === undefined) {
            return;
          }

          const target = getDropTarget(fromIndex, toIndex);

          if (target !== undefined) {
            await moveAndFocus(fromIndex, target);
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
          role="gridcell"
          tabindex={disabled || readonly ? undefined : 0}
          onkeydown={async (event) => {
            const targetIndex = getKeyboardMoveTarget({
              key: event.key,
              index,
              length: values.length,
              rtl: isRTL(),
            });

            if (targetIndex === -1) return;

            event.preventDefault();
            await moveAndFocus(index, targetIndex);
          }}
        >
          {label}
        </span>
        {#if option}
          <span role="gridcell">
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
          </span>
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
        // The select only reports a change once an option has been picked
        /* v8 ignore else */
        if (selectedValue) {
          values = [...values, selectedValue];
          onAddValue?.(new CustomEvent('AddValue', { detail: { value: selectedValue } }));
          // Reset the combobox
          selectedValue = undefined;
        }
      }}
    >
      {#each options as { label, value, searchValue } (value)}
        {#if !selectedValues.has(value)}
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

    span[role='grid'] {
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
        outline: var(--sui-focus-ring-width) solid var(--sui-focus-ring-color);
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
        margin-inline-start: -1px;
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

      span[role='gridcell']:not(.label) {
        display: contents;
      }

      :global {
        button {
          outline-offset: -2px;
        }

        .icon {
          font-size: var(--sui-font-size-large);
        }
      }
    }
  }
</style>
