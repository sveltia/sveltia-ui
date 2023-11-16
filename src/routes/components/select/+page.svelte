<script>
  import { Combobox, Divider, Option, Select } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Select</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <Select>
        <Option label="Option 1" />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Select>
    </div>
  </Example>
</section>

<section>
  <h3>Selected</h3>
  <Example>
    <div role="none">
      <Select>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Select>
    </div>
  </Example>
</section>

<section>
  <h3>With Filter</h3>
</section>

<section>
  <h3>Auto-complete (WIP)</h3>
  <Example>
    <div role="none">
      <Combobox>
        <Option label="Option 1" />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Combobox>
    </div>
  </Example>
</section>

<section>
  <h3>Tagging</h3>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <Select disabled>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Select>
    </div>
    <div role="none">
      <Combobox disabled>
        <Option label="Option 1" />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Combobox>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <Select readonly>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Select>
    </div>
    <div role="none">
      <Combobox readonly>
        <Option label="Option 1" />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Divider />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Combobox>
    </div>
  </Example>
</section>
