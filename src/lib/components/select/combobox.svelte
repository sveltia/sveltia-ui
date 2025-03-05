<!--
  @component
  A variant of the `<Select>` widget with an auto-complete text input field.
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  @todo Add DOM API compatibility.
-->
<script>
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Listbox from '../listbox/listbox.svelte';
  import SearchBar from '../text-field/search-bar.svelte';
  import TextInput from '../text-field/text-input.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * @type {import('$lib/typedefs').ComboboxProps & import('$lib/typedefs').TextInputProps &
   * Record<string, any>}
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
    children,
    chevronIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
  const selectedSelector = '[role="option"][aria-selected="true"]';
  let isPopupOpen = $state(false);

  /** @type {HTMLElement | undefined} */
  let comboboxElement = $state();
  /** @type {HTMLInputElement | undefined} */
  let inputElement = $state();
  /** @type {HTMLElement | undefined} */
  let popupContent = $state();
  /** @type {string} */
  let label = $state('');
  /** @type {boolean} */
  let showFilter = $state(false);
  /** @type {string} */
  let searchTerms = $state('');
  /** @type {boolean} */
  let hasMatchingOptions = $state(true);
  /** @type {HTMLElement} */
  const anchor = $derived(/** @type {HTMLElement} */ (comboboxElement ?? inputElement));

  /**
   * Update the {@link label} and selected option when the {@link value} is changed.
   */
  const _onChange = () => {
    const selected = popupContent?.querySelector(selectedSelector);

    const target = /** @type {HTMLButtonElement} */ (
      popupContent?.querySelector(`[role="option"][value="${value}"]`)
    );

    if (target) {
      label = target.dataset.label || target.textContent || target.value;

      if (selected !== target) {
        selected?.setAttribute('aria-selected', 'false');
        target.setAttribute('aria-selected', 'true');
      }
    }
  };

  /**
   * Update the {@link value} whenever an option is selected.
   * @param {HTMLButtonElement} target - Selected option.
   */
  const _onSelect = (target) => {
    // @todo support more types
    // @ts-ignore
    value = target.dataset.type === 'number' ? Number(target.value) : target.value;
    _onChange();
    onChange?.(new CustomEvent('Change', { detail: { target: inputElement, value } }));
  };

  $effect(() => {
    if (popupContent) {
      globalThis.requestAnimationFrame(() => {
        const selected = popupContent?.querySelector(selectedSelector);

        if (selected) {
          _onSelect(/** @type {HTMLButtonElement} */ (selected));
        }
      });
    }
  });

  $effect(() => {
    void value;
    _onChange();
  });
</script>

<div {...restProps} role="none" class="sui combobox {className}" class:editable {hidden}>
  {#if !editable}
    <div
      bind:this={comboboxElement}
      {...restProps}
      role="combobox"
      {id}
      class:selected={value !== undefined}
      tabindex={disabled ? -1 : 0}
      aria-controls="{id}-popup"
      aria-expanded={isPopupOpen}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-required={required}
      aria-invalid={invalid}
      aria-haspopup="listbox"
    >
      <div role="none" class="label">
        {value !== undefined ? label : $_('_sui.combobox.select_an_option')}
      </div>
    </div>
  {:else}
    <TextInput
      {...restProps}
      bind:element={inputElement}
      role="combobox"
      {id}
      {value}
      {hidden}
      {disabled}
      {readonly}
      {required}
      {invalid}
      aria-controls="{id}-popup"
      aria-expanded={isPopupOpen}
      aria-haspopup="listbox"
    />
  {/if}
  <Button
    variant="ghost"
    iconic
    {hidden}
    {disabled}
    tabindex={!editable || readonly || disabled ? -1 : 0}
    aria-label={isPopupOpen ? $_('_sui.collapse') : $_('_sui.expand')}
    aria-controls="{id}-popup"
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
<Popup
  bind:content={popupContent}
  id="{id}-popup"
  class="combobox"
  {anchor}
  {position}
  touchOptimized={true}
  bind:open={isPopupOpen}
  onOpen={() => {
    showFilter = (popupContent?.querySelectorAll('[role="option"]')?.length ?? 0) > 5;
    searchTerms = '';
  }}
>
  <div role="none" class="combobox-inner">
    {#if showFilter}
      <SearchBar
        flex
        aria-label={$_('_sui.combobox.filter_options')}
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
        hasMatchingOptions = !!(/** @type {CustomEvent} */ (event).detail.matched);
      }}
    >
      {@render children?.()}
    </Listbox>
    {#if !hasMatchingOptions}
      <div role="alert" class="no-options">
        {$_('_sui.combobox.no_matching_options')}
      </div>
    {/if}
  </div>
</Popup>

<style lang="scss">
  .combobox {
    margin: var(--sui-focus-ring-width);
    display: flex;
    align-items: center;
    position: relative;
    min-width: var(--sui-combobox-min-width, calc(var(--sui-option-height) * 5));

    :global(.icon) {
      font-size: var(--sui-font-size-xx-large);
      opacity: 0.5;
    }

    & > :global(.icon) {
      position: absolute;
      inset: 8px auto auto 8px;
      z-index: 1;
    }

    & > :global(button) {
      position: absolute;
      inset: 0 0 auto auto;
      z-index: 1;
      margin: 0 !important;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &:not(.editable) > :global(button) {
      background-color: transparent !important;
    }

    & > :global(button[tabindex='-1']) {
      pointer-events: none;
    }

    div[role='combobox'] {
      display: flex;
      align-items: center;
      border-width: 1px;
      border-color: var(--sui-control-border-color);
      border-radius: var(--sui-textbox-border-radius);
      padding: 0 var(--sui-textbox-height) 0 calc(var(--sui-textbox-height) / 4);
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

      &:hover,
      &:focus {
        background-color: var(--sui-hover-background-color);
      }

      &[aria-invalid='true'] {
        border-color: var(--sui-error-border-color);
      }

      .label {
        display: block;
        overflow: hidden;
        width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    :global(.text-input) {
      margin: 0 !important;
      width: 100% !important;
    }

    :global(input) {
      padding: 0 32px 0 8px;
      width: 0; // = auto
    }

    & + :global([role='listbox']) {
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
    }

    & + :global([role='listbox']:not(.open)) {
      opacity: 0;
      pointer-events: none;
    }
  }

  .combobox-inner {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :global(.sui.search-bar) {
      flex: none;
    }

    :global(.sui.listbox) {
      flex: auto;
      overflow-y: auto;
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
