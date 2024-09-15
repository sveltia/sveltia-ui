<!--
  @component
  A tab widget.
  @see https://w3c.github.io/aria/#tab
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  import Button from '../button/button.svelte';

  /**
   * @typedef {object} Props
   * @property {boolean} [selected] - Whether to select the widget. An alias of the `aria-selected`
   * attribute.
   */

  /**
   * @type {import('$lib/typedefs').ButtonProps & import('$lib/typedefs').CommonEventHandlers &
   * Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    selected = false,
    children: _children,
    startIcon: _startIcon,
    endIcon: _endIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Button
  {...restProps}
  role="tab"
  class="sui tab {className}"
  {hidden}
  {disabled}
  aria-selected={selected}
>
  {#snippet startIcon()}
    {@render _startIcon?.()}
  {/snippet}
  {#snippet children()}
    {@render _children?.()}
  {/snippet}
  {#snippet endIcon()}
    {@render _endIcon?.()}
  {/snippet}
</Button>
