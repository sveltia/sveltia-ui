<!--
  @component
  A tab widget.
  @see https://w3c.github.io/aria/#tab
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  import Button from '../button/button.svelte';

  /**
   * The `class` attribute on the `<button>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to select the widget. An alias of the `aria-selected` attribute.
   * @type {boolean}
   */
  export let selected = false;
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
</script>

<Button
  class="sui tab {className}"
  role="tab"
  {hidden}
  {disabled}
  aria-selected={selected}
  {...$$restProps}
  on:select
>
  <slot name="start-icon" slot="start-icon" />
  <slot />
  <slot name="end-icon" slot="end-icon" />
</Button>
