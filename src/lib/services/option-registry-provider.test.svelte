<!--
  @component
  Test fixture standing in for a `<Combobox>`: provides a registry to its descendants.
-->
<script>
  import Consumer from './option-registry-consumer.test.svelte';
  import { createOptionRegistry } from './select.svelte.js';

  /**
   * @type {{
   * reportProvided: (registry: import('./select.svelte.js').OptionRegistry) => void,
   * reportConsumed: (registry: import('./select.svelte.js').OptionRegistry | undefined) => void,
   * }}
   */
  const { reportProvided, reportConsumed } = $props();

  // svelte-ignore state_referenced_locally
  reportProvided(createOptionRegistry());
</script>

<Consumer {reportConsumed} />
