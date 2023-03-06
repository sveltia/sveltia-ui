<!--
  @component
  @see https://w3c.github.io/aria-practices/#menubutton
-->
<script>
  import Menu from '../composite/menu.svelte';
  import Popup from '../util/popup.svelte';
  import Button from './button.svelte';

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
   * Whether to show an arrow icon next to the label, if `iconName` is not given. The default is
   * `true`.
   */
  export let showArrow = true;

  /** @type {?Button} */
  let buttonComponent;
  /** @type {?Menu} */
  let menuComponent;
</script>

<Button
  class="sui menu-button {className}"
  aria-haspopup="menu"
  iconName={$$props.iconName || (showArrow ? 'arrow_drop_down' : undefined)}
  iconPosition="end"
  {...$$restProps}
  bind:this={buttonComponent}
  on:keydown={(event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

    if (['ArrowUp', 'ArrowDown'].includes(key) && !ctrlKey && !metaKey && !shiftKey && !altKey) {
      event.preventDefault();

      const members = [
        ...menuComponent.element.querySelectorAll('[role^="menuitem"]:not([aria-disabled="true"])'),
      ];

      if (members.length) {
        (key === 'ArrowUp' ? members.pop() : members.shift()).focus();
      }
    }
  }}
>
  <slot name="button" />
</Button>
<Popup anchor={buttonComponent?.element} {position}>
  <Menu bind:this={menuComponent}>
    <slot />
  </Menu>
</Popup>
