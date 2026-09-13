<!--
  @component
  Test fixture: an `<Option>` within an option registry, standing in for a `<Combobox>`.
-->
<script>
  import { createOptionRegistry } from '../../services/select.svelte.js';
  import Option from './option.svelte';

  /**
   * @type {{
   * registry?: import('../../services/select.svelte.js').OptionRegistry,
   * expanded?: boolean,
   * selected?: boolean,
   * disabled?: boolean,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    registry = $bindable(),
    expanded = false,
    selected = $bindable(false),
    disabled = false,
    /* eslint-enable prefer-const */
  } = $props();

  const _registry = createOptionRegistry();

  // svelte-ignore state_referenced_locally
  registry = _registry;

  $effect(() => {
    _registry.expanded = expanded;
  });
</script>

<Option label="Apple" value="apple" name="fruit" bind:selected {disabled} />
