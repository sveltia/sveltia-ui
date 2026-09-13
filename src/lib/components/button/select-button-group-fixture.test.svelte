<!--
  @component
  Test fixture: a `<SelectButtonGroup>` with a few `<SelectButton>`s.
-->
<script>
  import SelectButtonGroup from './select-button-group.svelte';
  import SelectButton from './select-button.svelte';

  /** @type {{ onChange?: (event: CustomEvent) => void }} */
  const { onChange = undefined } = $props();
</script>

<SelectButtonGroup ariaLabel="View" {onChange}>
  <SelectButton label="Grid" value="grid" selected={true} />
  <SelectButton label="List" value="list" />
  <SelectButton label="Table" value="table" />
</SelectButtonGroup>
