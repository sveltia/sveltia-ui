<!--
  @component
  Internal: the visible label of a field with the `showLabelAbove` option, on a line of its own at
  the start of the field’s wrapper. The field keeps its `aria-label`, so this is only what a sighted
  user sees, and what they can click to focus the field.
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} label Label text.
   * @property {string} [for] ID of the field, when it’s a labelable element, such as an `<input>`.
   * @property {() => HTMLElement | null | undefined} [getTarget] Element to focus on a click,
   * when the field isn’t a labelable element, such as a `role="combobox"` or `role="slider"`
   * `<div>`. It’s left alone while it’s disabled, as a native field would be.
   * @property {string} [id] The `id` attribute, for a wrapper to point `aria-labelledby` at.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    label,
    for: htmlFor = undefined,
    getTarget = undefined,
    id = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<!--
  A click on a label already focuses a labelable field, which leaves the keyboard to reach the other
  fields directly, so this click handler needs no keyboard equivalent
-->
<!--
  svelte-ignore a11y_click_events_have_key_events,
  a11y_no_noninteractive_element_interactions
-->
<label
  for={htmlFor}
  {id}
  class="sui label-above"
  onclick={() => {
    const target = getTarget?.();

    if (target && target.getAttribute('aria-disabled') !== 'true') {
      target.focus();
    }
  }}
>
  {label}
</label>

<style lang="scss">
  .label-above {
    display: block;
    // A line of its own in a wrapping flex container or a grid
    flex: 0 0 100%;
    grid-column: 1 / -1;
    margin-block-end: 4px;
    color: var(--sui-secondary-foreground-color);
    font-size: var(--sui-font-size-small);
    font-weight: var(--sui-font-weight-bold, bold);
  }
</style>
