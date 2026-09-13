<!--
  @component
  Test fixture: a `<RadioGroup>` with a few `<Radio>`s bound to one value.
-->
<script>
  import RadioGroup from './radio-group.svelte';
  import Radio from './radio.svelte';

  /**
   * @type {{
   * group?: string,
   * disabled?: boolean,
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    group = $bindable('red'),
    disabled = false,
    onChange = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<RadioGroup ariaLabel="Color" {disabled} {onChange}>
  <Radio label="Red" value="red" bind:group />
  <Radio label="Green" value="green" bind:group />
  <Radio label="Blue" value="blue" bind:group />
</RadioGroup>
