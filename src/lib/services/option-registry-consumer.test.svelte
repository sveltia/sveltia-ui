<!--
  @component
  Test fixture standing in for an `<Option>`: reports the registry it can see through the context,
  which is `undefined` unless an ancestor provided one.
-->
<script>
  import { getOptionRegistry } from './select.svelte.js';

  /**
   * @type {{
   * reportConsumed: (registry: import('./select.svelte.js').OptionRegistry | undefined) => void,
   * }}
   */
  const { reportConsumed } = $props();

  // svelte-ignore state_referenced_locally
  reportConsumed(getOptionRegistry());
</script>
