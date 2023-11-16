<script>
  import { Listbox, Option, OptionGroup } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Listbox</h2>

<section>
  <h3>Single Select</h3>
  <Example>
    <div role="none">
      <Listbox>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Listbox>
    </div>
  </Example>
</section>

<section>
  <h3>Multi Select</h3>
  <Example>
    <div role="none">
      <Listbox multiple>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" selected />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Listbox>
    </div>
  </Example>
</section>

<section>
  <h3>With Groups</h3>
  <Example>
    <div role="none">
      <Listbox>
        <OptionGroup label="Group 1">
          <Option label="Option 1" selected />
          <Option label="Option 2" />
        </OptionGroup>
        <OptionGroup label="Group 2">
          <Option label="Option 3" />
          <Option label="Option 4" />
          <Option label="Option 5" disabled />
        </OptionGroup>
      </Listbox>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <Listbox disabled>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Listbox>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <Listbox readonly>
        <Option label="Option 1" selected />
        <Option label="Option 2" />
        <Option label="Option 3" />
        <Option label="Option 4" />
        <Option label="Option 5" disabled />
      </Listbox>
    </div>
  </Example>
</section>
