<script>
  import { SelectButton, SelectButtonGroup } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Button Group</h2>

<section>
  <h3>Standard</h3>
</section>

<section>
  <h3>Single Select</h3>
  <Example>
    <div>
      <SelectButtonGroup>
        <SelectButton variant="tertiary" selected label="Strawberry" />
        <SelectButton variant="tertiary" label="Grape" />
        <SelectButton variant="tertiary" label="Lemon" />
        <SelectButton variant="tertiary" label="Orange" disabled />
      </SelectButtonGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <SelectButtonGroup disabled>
        <SelectButton variant="tertiary" selected label="Strawberry" />
        <SelectButton variant="tertiary" label="Grape" />
        <SelectButton variant="tertiary" label="Lemon" />
        <SelectButton variant="tertiary" label="Orange" disabled />
      </SelectButtonGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <SelectButtonGroup readonly>
        <SelectButton variant="tertiary" selected label="Strawberry" />
        <SelectButton variant="tertiary" label="Grape" />
        <SelectButton variant="tertiary" label="Lemon" />
        <SelectButton variant="tertiary" label="Orange" disabled />
      </SelectButtonGroup>
    </div>
  </Example>
</section>
