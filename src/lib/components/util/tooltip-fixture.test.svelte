<!--
  @component
  Test fixture: buttons with a tooltip listed by a keyed `{#each}` block, which removes a button
  while it may have the focus.
-->
<script>
  import Button from '../button/button.svelte';

  /** @type {{ labels: string[] }} */
  let {
    /* eslint-disable prefer-const */
    labels,
    /* eslint-enable prefer-const */
  } = $props();
</script>

{#each labels as label (label)}
  <Button {label} tooltip={label} />
{/each}
