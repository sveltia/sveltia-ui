<!--
  @component
  A variant of the `<Select>` widget with an auto-complete text input field.
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  @todo Add DOM API compatibility.
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import Button from '$lib/components/button/button.svelte';
  import Icon from '$lib/components/icon/icon.svelte';
  import Listbox from '$lib/components/listbox/listbox.svelte';
  import SearchBar from '$lib/components/text-field/search-bar.svelte';
  import TextInput from '$lib/components/text-field/text-input.svelte';
  import Popup from '$lib/components/util/popup.svelte';

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
   * Selected option’s value.
   * @type {(string | number | undefined)}
   */
  export let value = undefined;
  /**
   * Whether to make the `combobox` editable.
   */
  export let editable = true;
  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';

  const dispatch = createEventDispatcher();
  const id = generateElementId('combobox');
  const selectedSelector = '[role="option"][aria-selected="true"]';
  /** @type {HTMLElement} */
  let comboboxElement;
  /** @type {TextInput | undefined} */
  let inputComponent;
  /** @type {Popup | undefined} */
  let popupComponent;
  let isPopupOpen = writable(false);
  /** @type {string} */
  let label = '';
  /** @type {boolean} */
  let showFilter = false;
  /** @type {string} */
  let searchTerms = '';
  /** @type {boolean} */
  let hasMatchingOptions = true;

  /**
   * Update the {@link label} and selected option when the {@link value} is changed.
   */
  const onChange = () => {
    const selected = popupComponent?.content?.querySelector(selectedSelector);

    const target = /** @type {HTMLButtonElement} */ (
      popupComponent?.content?.querySelector(`[role="option"][value="${value}"]`)
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
  const onSelect = (target) => {
    // @todo support more types
    value = target.dataset.type === 'number' ? Number(target.value) : target.value;
    onChange();
    dispatch('change', { target: inputComponent?.element, value });
  };

  $: {
    if (popupComponent?.content) {
      globalThis.requestAnimationFrame(() => {
        const selected = popupComponent?.content?.querySelector(selectedSelector);

        if (selected) {
          onSelect(/** @type {HTMLButtonElement} */ (selected));
        }
      });
    }
  }

  $: {
    void value;
    onChange();
  }
</script>

<div
  role="none"
  class="sui combobox {className}"
  class:editable
  hidden={hidden || undefined}
  {...$$restProps}
>
  {#if !editable}
    <div
      role="combobox"
      {id}
      class:selected={value !== undefined}
      tabindex={disabled ? -1 : 0}
      aria-controls="{id}-popup"
      aria-expanded={$isPopupOpen}
      aria-hidden={hidden}
      aria-disabled={disabled}
      aria-readonly={readonly}
      aria-haspopup="listbox"
      aria-activedescendant="selected-option"
      {...$$restProps}
      bind:this={comboboxElement}
    >
      <div role="none" class="label">
        {value !== undefined ? label : $_('_sui.combobox.select_an_option')}
      </div>
    </div>
  {:else}
    <TextInput
      role="combobox"
      {id}
      {value}
      {hidden}
      {disabled}
      {readonly}
      {required}
      {invalid}
      aria-controls="{id}-popup"
      aria-expanded={$isPopupOpen}
      aria-haspopup="listbox"
      aria-activedescendant="selected-option"
      {...$$restProps}
      bind:this={inputComponent}
    />
  {/if}
  <Button
    variant="ghost"
    iconic
    {hidden}
    {disabled}
    tabindex={readonly || disabled ? -1 : 0}
    aria-label={$isPopupOpen ? $_('_sui.collapse') : $_('_sui.expand')}
    aria-controls="{id}-popup"
    aria-expanded={$isPopupOpen}
    on:click={(event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!disabled && !readonly) {
        $isPopupOpen = !$isPopupOpen;
      }
    }}
  >
    <slot name="chevron-icon" slot="start-icon">
      <Icon name="expand_more" />
    </slot>
  </Button>
</div>
<Popup
  id="{id}-popup"
  class="combobox"
  anchor={comboboxElement ?? inputComponent?.element}
  {position}
  touchOptimized={true}
  bind:open={isPopupOpen}
  bind:this={popupComponent}
  on:open={() => {
    showFilter = (popupComponent?.content?.querySelectorAll('[role="option"]')?.length ?? 0) > 5;
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
        on:keydown={(event) => {
          if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            event.preventDefault();
            popupComponent?.content
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
      on:click={(event) => {
        if (/** @type {HTMLElement} */ (event.target).matches('[role="option"]')) {
          onSelect(/** @type {HTMLButtonElement} */ (event.target));
        }
      }}
      on:filter={(event) => {
        hasMatchingOptions = !!(/** @type {CustomEvent} */ (event).detail.matched);
      }}
    >
      <slot />
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
