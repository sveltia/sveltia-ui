<!--
  @component
  A variant of the `<Select>` widget with an auto-complete text input field.
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  @todo Add DOM API compatibility.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import { getRandomId } from '../../services/util';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Listbox from '../listbox/listbox.svelte';
  import TextInput from '../text-field/text-input.svelte';
  import Popup from '../util/popup.svelte';

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
  const id = getRandomId('combobox');
  /** @type {HTMLElement} */
  let comboboxElement;
  /** @type {TextInput?} */
  let inputComponent;
  /** @type {Popup?} */
  let popupComponent;
  let isPopupOpen = writable(false);
  /** @type {string} */
  let label = '';

  /**
   * Update the `value` and `label` whenever an option is selected
   * @param {HTMLButtonElement} target Selected option.
   */
  const onSelect = (target) => {
    // @todo support more types
    value = target.dataset.type === 'number' ? Number(target.value) : target.value;
    label = target.querySelector('.label')?.textContent || target.value;
    dispatch('change', { target: inputComponent?.element, value });
  };

  $: {
    if (popupComponent?.content) {
      window.requestAnimationFrame(() => {
        const selected = popupComponent.content.querySelector(
          '[role="option"][aria-selected="true"]',
        );

        if (selected) {
          onSelect(/** @type {HTMLButtonElement?} */ (selected));
        }
      });
    }
  }
</script>

<div class="sui combobox {className}" hidden={hidden || undefined} {...$$restProps}>
  {#if !editable}
    <div
      {id}
      class:selected={value !== undefined}
      tabindex={disabled ? -1 : 0}
      role="combobox"
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
      <div class="label">
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
    <Icon
      slot="start-icon"
      name="expand_more"
      label={$isPopupOpen ? $_('_sui.collapse') : $_('_sui.expand')}
    />
  </Button>
</div>
<Popup
  id="{id}-popup"
  class="combobox"
  anchor={comboboxElement ?? inputComponent?.element}
  {position}
  keepContent={true}
  touchOptimized={true}
  bind:open={isPopupOpen}
  bind:this={popupComponent}
>
  <Listbox
    on:click={(event) => {
      if (/** @type {HTMLElement} */ (event.target).matches('[role="option"]')) {
        onSelect(/** @type {HTMLButtonElement?} */ (event.target));
      }
    }}
  >
    <slot />
  </Listbox>
</Popup>

<style lang="scss">
  .combobox {
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
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &.readonly > :global(button) {
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

    :global(input) {
      padding: 0 32px 0 8px;
      width: 100%;
    }

    & + :global([role='listbox']) {
      position: fixed;
      z-index: 100;
      border-radius: var(--sui-control-medium-border-radius);
      box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
      overflow: auto;
      background-color: var(--sui-secondary-background-color);
      -webkit-backdrop-filter: blur(16px);
      backdrop-filter: blur(16px);
      /* Add .1s delay before the position can be determined */
      transition: opacity 100ms 100ms;
    }

    & + :global([role='listbox']:not(.open)) {
      opacity: 0;
      pointer-events: none;
    }
  }
</style>
