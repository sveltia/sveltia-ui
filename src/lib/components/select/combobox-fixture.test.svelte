<!--
  @component
  Test fixture: a `<Combobox>` (or `<Select>`) with a handful of `<Option>`s.
-->
<script>
  import Option from '../listbox/option.svelte';
  import Combobox from './combobox.svelte';
  import Select from './select.svelte';

  /**
   * @type {{
   * component?: 'combobox' | 'select',
   * value?: any,
   * editable?: boolean,
   * disabled?: boolean,
   * readonly?: boolean,
   * count?: number,
   * filterThreshold?: number,
   * initiallySelected?: string,
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    component = 'combobox',
    value = $bindable(),
    editable = true,
    disabled = false,
    readonly = false,
    count = 3,
    filterThreshold = 5,
    initiallySelected = undefined,
    onChange = undefined,
    /* eslint-enable prefer-const */
  } = $props();

  const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];
  const options = $derived(fruits.slice(0, count));
  const Component = $derived(component === 'select' ? Select : Combobox);
</script>

<Component
  bind:value
  {editable}
  {disabled}
  {readonly}
  {filterThreshold}
  {onChange}
  ariaLabel="Fruit"
>
  {#each options as label (label)}
    <Option {label} value={label.toLowerCase()} selected={label === initiallySelected} />
  {/each}
</Component>
