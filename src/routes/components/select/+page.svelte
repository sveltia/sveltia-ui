<script>
  import { Combobox, Divider, Option, Select, SelectTags } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Select</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <Select>
        <Option label="Banana" />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Select>
    </div>
  </Example>
</section>

<section>
  <h3>Selected</h3>
  <Example>
    <div role="none">
      <Select>
        <Option label="Banana" selected />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Select>
    </div>
  </Example>
</section>

<section>
  <h3>With Filter</h3>
  <Example>
    <div role="none">
      <Select>
        <Option label="Banana" selected />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
        <Divider />
        <Option label="Pineapple" />
        <Option label="Apricot" />
        <Option label="Blueberry" />
        <Option label="Cherry" />
      </Select>
    </div>
  </Example>
</section>

<section>
  <h3>Auto-complete (WIP)</h3>
  <Example>
    <div role="none">
      <Combobox>
        <Option label="Banana" />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Combobox>
    </div>
  </Example>
</section>

<section>
  <h3>Tagging</h3>
  <Example>
    <div role="none">
      <SelectTags
        values={['banana']}
        options={[
          { label: 'Banana', value: 'banana' },
          { label: 'Mango', value: 'mango' },
          { label: 'Apple', value: 'apple' },
          { label: 'Avocado', value: 'avocado' },
          { label: 'Grape', value: 'grape' },
        ]}
      />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <Select disabled>
        <Option label="Banana" selected />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Select>
    </div>
    <div role="none">
      <Combobox disabled>
        <Option label="Banana" />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Combobox>
    </div>
    <div role="none">
      <SelectTags
        disabled
        values={['banana']}
        options={[
          { label: 'Banana', value: 'banana' },
          { label: 'Mango', value: 'mango' },
          { label: 'Apple', value: 'apple' },
          { label: 'Avocado', value: 'avocado' },
          { label: 'Grape', value: 'grape' },
        ]}
      />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <Select readonly>
        <Option label="Banana" selected />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Select>
    </div>
    <div role="none">
      <Combobox readonly>
        <Option label="Banana" />
        <Option label="Mango" />
        <Option label="Apple" />
        <Divider />
        <Option label="Avocado" />
        <Option label="Grape" disabled />
      </Combobox>
    </div>
    <div role="none">
      <SelectTags
        readonly
        values={['banana']}
        options={[
          { label: 'Banana', value: 'banana' },
          { label: 'Mango', value: 'mango' },
          { label: 'Apple', value: 'apple' },
          { label: 'Avocado', value: 'avocado' },
          { label: 'Grape', value: 'grape' },
        ]}
      />
    </div>
  </Example>
</section>
