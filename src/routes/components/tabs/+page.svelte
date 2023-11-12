<script>
  import { Tab, TabList, TabPanel } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Tabs</h2>

<section>
  <h3>Horizontal</h3>
  <Example>
    <div>
      <TabList>
        <Tab label="Tab 1" aria-controls="tabpanel-1" />
        <Tab label="Tab 2" aria-controls="tabpanel-2" />
        <Tab label="Tab 3" aria-controls="tabpanel-3" />
      </TabList>
      <!-- cSpell:disable -->
      <TabPanel id="tabpanel-1">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar scelerisque tincidunt.
        Curabitur vel vehicula mauris.
      </TabPanel>
      <TabPanel id="tabpanel-2">
        Etiam laoreet elementum quam ac blandit. Present magna massa, interdum sed leo quis, mollis
        mattis justo. Sed porta suscipit feugiat.
      </TabPanel>
      <TabPanel id="tabpanel-3">
        Morbi scelerisque dui est, non ultricies dui sollicitudin ac. Sed quis ex eu massa
        sollicitudin malesuada. Ut et vulputate lacus, bibendum viverra quam.
      </TabPanel>
      <!-- cSpell:enable -->
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <Example>
    <div>
      <TabList orientation="vertical">
        <Tab label="Tab 4" aria-controls="tabpanel-4" />
        <Tab label="Tab 5" aria-controls="tabpanel-5" />
        <Tab label="Tab 6" aria-controls="tabpanel-6" />
      </TabList>
      <!-- cSpell:disable -->
      <TabPanel id="tabpanel-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar scelerisque tincidunt.
        Curabitur vel vehicula mauris.
      </TabPanel>
      <TabPanel id="tabpanel-5">
        Etiam laoreet elementum quam ac blandit. Present magna massa, interdum sed leo quis, mollis
        mattis justo. Sed porta suscipit feugiat.
      </TabPanel>
      <TabPanel id="tabpanel-6">
        Morbi scelerisque dui est, non ultricies dui sollicitudin ac. Sed quis ex eu massa
        sollicitudin malesuada. Ut et vulputate lacus, bibendum viverra quam.
      </TabPanel>
      <!-- cSpell:enable -->
    </div>
  </Example>
</section>

<section>
  <h3>Interactive</h3>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <TabList disabled>
        <Tab label="Tab 1" aria-controls="tabpanel-1" />
        <Tab label="Tab 2" aria-controls="tabpanel-2" />
        <Tab label="Tab 3" aria-controls="tabpanel-3" />
      </TabList>
      <!-- cSpell:disable -->
      <TabPanel id="tabpanel-1">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar scelerisque tincidunt.
        Curabitur vel vehicula mauris.
      </TabPanel>
      <TabPanel id="tabpanel-2">
        Etiam laoreet elementum quam ac blandit. Present magna massa, interdum sed leo quis, mollis
        mattis justo. Sed porta suscipit feugiat.
      </TabPanel>
      <TabPanel id="tabpanel-3">
        Morbi scelerisque dui est, non ultricies dui sollicitudin ac. Sed quis ex eu massa
        sollicitudin malesuada. Ut et vulputate lacus, bibendum viverra quam.
      </TabPanel>
      <!-- cSpell:enable -->
    </div>
  </Example>
</section>
