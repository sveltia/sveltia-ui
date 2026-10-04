<!--
  @component
  Test fixture: a `<TabList>` with a few `<Tab>`s and their panels.
-->
<script>
  import TabList from './tab-list.svelte';
  import TabPanel from './tab-panel.svelte';
  import Tab from './tab.svelte';

  /**
   * @type {{
   * orientation?: 'horizontal' | 'vertical',
   * selected?: 'general' | 'advanced',
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  const { orientation = 'horizontal', selected = 'general', onChange = undefined } = $props();
</script>

<TabList ariaLabel="Settings" name="settings" {orientation} {onChange}>
  <Tab label="General" aria-controls="panel-general" selected={selected === 'general'} />
  <Tab label="Advanced" aria-controls="panel-advanced" selected={selected === 'advanced'} />
</TabList>
<TabPanel id="panel-general">General panel</TabPanel>
<TabPanel id="panel-advanced">Advanced panel</TabPanel>
