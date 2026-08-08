<!--
  @component
  A variant of the `<Select>` widget with an auto-complete text input field.
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  @todo Add DOM API compatibility.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { onMount } from 'svelte';
  import { createOptionRegistry, getSelectedItemDetail } from '../../services/select.svelte.js';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Listbox from '../listbox/listbox.svelte';
  import SearchBar from '../text-field/search-bar.svelte';
  import TextInput from '../text-field/text-input.svelte';
  import TruncatedText from '../typography/truncated-text.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * @import { ComboboxProps, TextInputProps } from '$lib/typedefs';
   */

  /**
   * @type {ComboboxProps & TextInputProps & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    editable = true,
    position = 'bottom-left',
    filterThreshold = 5,
    ariaLabel = undefined,
    children,
    chevronIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
  let isPopupOpen = $state(false);

  /** @type {HTMLElement | undefined} */
  let comboboxElement = $state();
  /** @type {HTMLInputElement | undefined} */
  let inputElement = $state();
  /** @type {HTMLElement | undefined} */
  let popupContent = $state();
  /**
   * Wrapper holding the options while the dropdown is collapsed.
   * @type {HTMLElement | undefined}
   */
  let idleHost = $state();
  /**
   * Wrapper holding the options, moved between {@link idleHost} and {@link listboxSlot}.
   * @type {HTMLElement | undefined}
   */
  let optionHost = $state();
  /**
   * Where the options go while the dropdown is expanded.
   * @type {HTMLElement | undefined}
   */
  let listboxSlot = $state();
  /** @type {string} */
  let label = $state('');
  /** @type {boolean} */
  let showFilter = $state(false);
  /** @type {string} */
  let searchTerms = $state('');
  /**
   * Number of options matching the current search terms, as last reported by the listbox.
   * @type {number}
   */
  let matchedOptions = $state(0);

  /**
   * Whether to keep the option list free of the “no matching options” notice. That notice is about
   * filtering, so it’s only meaningful once search terms have been entered — the listbox also
   * reports zero matches while the options are unrendered, which says nothing about the filter.
   * @type {boolean}
   */
  const hasMatchingOptions = $derived(!searchTerms || matchedOptions > 0);
  /**
   * @type {HTMLElement}
   */
  const anchor = $derived(/** @type {HTMLElement} */ (comboboxElement ?? inputElement));

  /**
   * The options declared as `<Option>` children. They only render while the dropdown is expanded,
   * so the label and the initial value below are resolved through the registry rather than the DOM
   * tree.
   */
  const registry = createOptionRegistry();

  /**
   * Update the {@link label} and selected option when the {@link value} is changed.
   */
  const _onChange = () => {
    const entry = registry.find(value);

    if (entry) {
      label = entry.label;
      registry.selectOnly(value);
    }
  };

  /**
   * Update the {@link value} whenever an option is selected.
   * @param {HTMLButtonElement} target Selected option.
   */
  const _onSelect = (target) => {
    const detail = getSelectedItemDetail(target);

    value = detail.value;

    _onChange();
    onChange?.(new CustomEvent('Change', { detail }));
  };

  // Let the options know whether they should render themselves
  $effect(() => {
    registry.expanded = isPopupOpen;
  });

  // Move the options into the popup while it’s expanded, and back out before it’s unmounted. Only
  // the wrapper is moved, never its children, so Svelte keeps full ownership of the subtree.
  $effect(() => {
    if (!optionHost) {
      return;
    }

    const parent = isPopupOpen ? listboxSlot : idleHost;

    if (parent && optionHost.parentElement !== parent) {
      parent.append(optionHost);
    }
  });

  // Derive the initial value from the `<Option>` that is marked as selected in the markup. This has
  // to be a one-off read rather than an effect on `registry.selectedEntry`: where the markup marks
  // nothing as selected, the first entry to become selected is the one the user picks, and
  // reporting that here would raise a second `Change` for a single choice. The options register
  // during their own initialization, so they are all present by the time this runs.
  onMount(() => {
    const entry = registry.selectedEntry;

    if (!entry) {
      return;
    }

    value = entry.value;
    label = entry.label;

    // There is no element to report while the dropdown has never been expanded
    onChange?.(
      new CustomEvent('Change', {
        detail: {
          target: undefined,
          type: entry.type,
          name: entry.name,
          label: entry.label,
          value: entry.value,
        },
      }),
    );
  });

  $effect(() => {
    void value;
    _onChange();
  });
</script>

<!--
  `aria-controls` is deliberately absent from the `role="combobox"` element below: the popup is
  only in the DOM tree while it’s expanded, and a reference to a missing element is worse than no
  reference at all. The popup service adds it on open and removes it on close.
-->
<div {...restProps} role="none" class="sui combobox {className}" class:editable {hidden}>
  {#if !editable}
    <div
      bind:this={comboboxElement}
      {...restProps}
      role="combobox"
      {id}
      class:selected={value !== undefined}
      tabindex={disabled ? -1 : 0}
      aria-expanded={isPopupOpen}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-required={required}
      aria-invalid={invalid}
      aria-haspopup="listbox"
      aria-label={ariaLabel}
    >
      <div role="none" class="label">
        <TruncatedText>
          {value !== undefined ? label : _('_sui.combobox.select_an_option')}
        </TruncatedText>
      </div>
    </div>
  {:else}
    <TextInput
      {...restProps}
      dir="auto"
      bind:element={inputElement}
      role="combobox"
      {id}
      value={value === undefined ? '' : String(value)}
      {hidden}
      {disabled}
      {readonly}
      {required}
      {invalid}
      aria-expanded={isPopupOpen}
      aria-haspopup="listbox"
      aria-label={ariaLabel}
    />
  {/if}
  <Button
    variant="ghost"
    iconic
    {hidden}
    {disabled}
    tabindex={!editable || readonly || disabled ? -1 : 0}
    aria-label={isPopupOpen ? _('_sui.collapse') : _('_sui.expand')}
    aria-controls={isPopupOpen ? `${id}-popup` : undefined}
    aria-expanded={isPopupOpen}
    onclick={(event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled && !readonly) {
        isPopupOpen = !isPopupOpen;
      }
    }}
  >
    {#snippet startIcon()}
      {#if chevronIcon}
        {@render chevronIcon()}
      {:else}
        <Icon name="expand_more" />
      {/if}
    {/snippet}
  </Button>
</div>
<!--
  The `<Option>`s have to stay instantiated while the dropdown is collapsed, so that the registry
  above can resolve the current label. They render no DOM of their own in that state, so this host
  is empty apart from any other markup the consumer interleaved, such as a `<Divider>`. It’s moved
  into the popup when the dropdown expands, which keeps a single set of component instances and lets
  Svelte own the rendering order.
-->
<div bind:this={idleHost} role="none" class="idle-host" hidden>
  <div bind:this={optionHost} role="none" class="option-host">
    <Listbox
      id="{id}-listbox"
      class="in-combobox"
      {searchTerms}
      onclick={(event) => {
        if (/** @type {HTMLElement} */ (event.target).matches('[role="option"]')) {
          _onSelect(/** @type {HTMLButtonElement} */ (event.target));
        }
      }}
      onFilter={(event) => {
        matchedOptions = /** @type {CustomEvent} */ (event).detail.matched;
      }}
    >
      {@render children?.()}
    </Listbox>
  </div>
</div>
<Popup
  bind:content={popupContent}
  id="{id}-popup"
  class="combobox"
  {anchor}
  {position}
  touchOptimized={true}
  bind:open={isPopupOpen}
  onOpen={() => {
    showFilter = filterThreshold === -1 ? false : registry.count > filterThreshold;
    searchTerms = '';
  }}
>
  <div role="none" class="combobox-inner">
    {#if showFilter}
      <SearchBar
        flex
        aria-label={_('_sui.combobox.filter_options')}
        aria-controls="{id}-listbox"
        bind:value={searchTerms}
        onkeydown={(event) => {
          if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            event.preventDefault();
            popupContent
              ?.querySelector('.sui.listbox')
              ?.dispatchEvent(new KeyboardEvent('keydown', event));
          }
        }}
      />
    {/if}
    <div bind:this={listboxSlot} role="none" class="listbox-slot"></div>
    {#if !hasMatchingOptions}
      <div role="alert" class="no-options" aria-live="assertive">
        {_('_sui.combobox.no_matching_options')}
      </div>
    {/if}
  </div>
</Popup>

<style lang="scss">
  // Transparent wrappers, so the `<Listbox>` stays a direct flex child of `.combobox-inner` once
  // it’s moved into the popup
  :is(.option-host, .listbox-slot) {
    display: contents;
  }

  .combobox {
    margin: var(--sui-focus-ring-width);
    display: flex;
    align-items: center;
    position: relative;
    min-width: var(--sui-combobox-min-width, calc(var(--sui-option-height) * 5));

    div[role='combobox'] {
      display: flex;
      align-items: center;
      border-width: 1px;
      border-color: var(--sui-control-border-color);
      border-radius: var(--sui-textbox-border-radius);
      padding-block: 0;
      padding-inline-start: calc(var(--sui-textbox-height) / 4);
      padding-inline-end: var(--sui-textbox-height);
      width: 100%;
      height: var(--sui-textbox-height);
      color: var(--sui-control-foreground-color);
      background-color: var(--sui-disabled-background-color);
      font-family: var(--sui-control-font-family);
      font-size: var(--sui-control-font-size);
      line-height: var(--sui-control-line-height);
      -webkit-user-select: none;
      user-select: none;
      cursor: pointer;
      transition: all 200ms;

      &:not(.selected) {
        font-style: italic;
      }

      &:is(:hover, :focus) {
        background-color: var(--sui-hover-background-color);
      }

      &[aria-invalid='true'] {
        border-color: var(--sui-error-border-color);
      }

      .label {
        width: 100%;
      }
    }

    :global {
      .icon {
        font-size: var(--sui-font-size-xx-large);
        opacity: 0.5;
      }

      & > .icon {
        position: absolute;
        inset-block-start: 8px;
        inset-inline-start: 8px;
        z-index: 1;
      }

      & > button {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        z-index: 1;
        margin: 0 !important;
        border-start-start-radius: 0;
        border-end-start-radius: 0;
        background-color: transparent !important;

        &[tabindex='-1'] {
          pointer-events: none;
        }
      }

      &:not(.editable) > button {
        background-color: transparent !important;
      }

      .text-input {
        margin: 0 !important;
        width: 100% !important;
      }

      input {
        padding-block: 0;
        padding-inline: 8px 32px;
        width: 0; // = auto
      }

      & + [role='listbox'] {
        position: fixed;
        z-index: 100;
        border-radius: var(--sui-control-medium-border-radius);
        box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
        overflow: auto;
        background-color: var(--sui-secondary-background-color);
        -webkit-backdrop-filter: blur(32px);
        backdrop-filter: blur(32px);
        /* Add .1s delay before the position can be determined */
        transition: opacity 100ms 100ms;

        &:not(.open) {
          opacity: 0;
          pointer-events: none;
        }
      }
    }
  }

  .combobox-inner {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :global {
      .sui.search-bar {
        flex: none;
      }

      .sui.listbox {
        flex: auto;
        overflow-y: auto;
      }
    }

    .no-options {
      flex: none;
      display: flex;
      align-items: center;
      padding: var(--sui-option-padding);
      height: var(--sui-option-height);
      color: var(--sui-tertiary-foreground-color);
    }
  }
</style>
