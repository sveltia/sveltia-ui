<!--
  @component
  Test fixture: a `<Listbox>` with a few `<Option>`s, some of them in a group.
-->
<script>
  import Listbox from './listbox.svelte';
  import OptionGroup from './option-group.svelte';
  import Option from './option.svelte';

  /**
   * @type {{
   * multiple?: boolean,
   * searchTerms?: string,
   * onChange?: (event: CustomEvent) => void,
   * onFilter?: (event: CustomEvent) => void,
   * onOptionChange?: (event: CustomEvent) => void,
   * }}
   */
  const {
    multiple = false,
    searchTerms = '',
    onChange = undefined,
    onFilter = undefined,
    onOptionChange = undefined,
  } = $props();
</script>

<Listbox ariaLabel="Fruits" {multiple} {searchTerms} {onChange} {onFilter}>
  <Option label="Apple" value="apple" onChange={onOptionChange} />
  <Option label="Banana" value="banana" selected={true} />
  <OptionGroup label="Citrus">
    <Option label="Lemon" value="lemon" searchValue="sour yellow" />
    <Option label="Orange" value="orange" disabled={true} />
  </OptionGroup>
</Listbox>
