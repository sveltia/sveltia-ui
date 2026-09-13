<!--
  @component
  Test fixture: a `<Tree>` with nested `<TreeItem>`s.
-->
<script>
  import TreeItem from './tree-item.svelte';
  import Tree from './tree.svelte';

  /**
   * @type {{
   * multiple?: boolean,
   * disabled?: boolean,
   * readonly?: boolean,
   * expandOnSelect?: boolean,
   * expanded?: boolean,
   * selected?: boolean,
   * onChange?: (event: CustomEvent) => void,
   * onItemChange?: (event: CustomEvent) => void,
   * onItemSelect?: (event: CustomEvent) => void,
   * onItemExpand?: (event: CustomEvent) => void,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    multiple = false,
    disabled = false,
    readonly = false,
    expandOnSelect = true,
    expanded = $bindable(false),
    selected = $bindable(false),
    onChange = undefined,
    onItemChange = undefined,
    onItemSelect = undefined,
    onItemExpand = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Tree ariaLabel="Files" {multiple} {disabled} {readonly} {expandOnSelect} {onChange}>
  <TreeItem
    label="Documents"
    value="docs"
    bind:expanded
    bind:selected
    onChange={onItemChange}
    onSelect={onItemSelect}
    onExpand={onItemExpand}
  >
    {#snippet items()}
      <TreeItem label="Report" value="report" />
      <TreeItem label="Notes" value="notes">
        {#snippet items()}
          <TreeItem label="Draft" value="draft" />
        {/snippet}
      </TreeItem>
    {/snippet}
  </TreeItem>
  <TreeItem label="Pictures" value="pictures" />
</Tree>
