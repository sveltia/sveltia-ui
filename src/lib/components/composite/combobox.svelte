<!--
  @component
  @see https://w3c.github.io/aria/#combobox
  @see https://w3c.github.io/aria-practices/#combobox
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';
  import Button from '../core/button.svelte';
  import TextInput from '../core/text-input.svelte';
  import Popup from '../util/popup.svelte';
  import Listbox from './listbox.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';

  /**
   * Whether the textbox is editable.
   */
  export let readOnly = false;

  export let disabled = false;

  export let label = '';

  /**
   * Selected option’s value.
   * @type {(String|undefined)}
   */
  export let value = undefined;

  const dispatch = createEventDispatcher();
  let comboboxElement;
  /** @type {(TextInput| undefined)} */
  let inputComponent;
  /** @type {(Popup| undefined)} */
  let popupComponent;
  let isPopupOpen = writable(false);

  $: {
    dispatch('change', { target: inputComponent?.element, value });
  }

  $: {
    if (readOnly && value && popupComponent?.element) {
      window.requestAnimationFrame(() => {
        label =
          popupComponent?.element.querySelector('[aria-selected="true"] .label')?.textContent || '';
      });
    }
  }
</script>

<div class="sui combobox {className}">
  {#if readOnly}
    <!-- svelte-ignore a11y-role-has-required-aria-props -->
    <div
      class:selected={value !== undefined}
      role="combobox"
      aria-disabled={disabled ? true : undefined}
      aria-haspopup="listbox"
      aria-activedescendant="selected-option"
      {...$$restProps}
      bind:this={comboboxElement}
    >
      {value !== undefined ? label || value : $_('sui.combobox.select_an_option')}
    </div>
  {:else}
    <TextInput
      role="combobox"
      {value}
      {disabled}
      aria-haspopup="listbox"
      aria-activedescendant="selected-option"
      {...$$restProps}
      bind:this={inputComponent}
    />
  {/if}
  <Button
    {disabled}
    class="ternary iconic"
    iconName="expand_more"
    iconLabel={$isPopupOpen ? $_('sui._.collapse') : $_('sui._.expand')}
    on:click={(event) => {
      event.stopPropagation();

      if (!disabled) {
        $isPopupOpen = !$isPopupOpen;
      }
    }}
  />
</div>
<Popup
  anchor={comboboxElement || inputComponent?.element}
  {position}
  bind:open={isPopupOpen}
  bind:this={popupComponent}
>
  <Listbox
    on:click={({ target }) => {
      if (target.matches('[role="option"]')) {
        value = target.value;
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

    :global(.icon) {
      font-size: 20px;
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
    }

    div[role='combobox'] {
      display: flex;
      align-items: center;
      border-width: 1px;
      border-color: var(--control-border-color);
      border-radius: 4px;
      padding: 0 32px 0 8px;
      width: 100%;
      height: var(--input--medium--height);
      -webkit-user-select: none;
      user-select: none;
      cursor: pointer;

      &:not(.selected) {
        font-style: italic;
      }

      &[aria-disabled='true'] {
        background-color: var(--disabled-background-color);
        opacity: 0.4;
        cursor: default;
      }
    }

    :global(input) {
      padding: 0 32px 0 8px;
      width: 100%;
    }

    & + :global([role='listbox']) {
      // display: contents;
      position: fixed;
      z-index: 100;
      border-radius: 4px;
      box-shadow: 0 8px 16px var(--popup-shadow-color);
      overflow: auto;
      background-color: var(--secondary-background-color);
      backdrop-filter: blur(16px);
      // Add .1s delay before the position can be determined
      transition: opacity 100ms 100ms;
    }

    & + :global([role='listbox']:not(.open)) {
      opacity: 0;
      pointer-events: none;
    }
  }
</style>
