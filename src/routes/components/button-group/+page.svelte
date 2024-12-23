<script>
  import { SelectButton, SelectButtonGroup } from '$lib';
  import ButtonGroup from '$lib/components/button/button-group.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Example from '../../_components/example.svelte';
</script>

<h2>Button Group</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <ButtonGroup>
        <Button selected label="Strawberry" />
        <Button label="Grape" />
        <Button label="Lemon" />
        <Button label="Orange" disabled />
      </ButtonGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Single Select</h3>
  <Example>
    <div role="none">
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
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <SelectButtonGroup invalid>
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
    <div role="none">
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
    <div role="none">
      <SelectButtonGroup readonly>
        <SelectButton variant="tertiary" selected label="Strawberry" />
        <SelectButton variant="tertiary" label="Grape" />
        <SelectButton variant="tertiary" label="Lemon" />
        <SelectButton variant="tertiary" label="Orange" disabled />
      </SelectButtonGroup>
    </div>
  </Example>
</section>
