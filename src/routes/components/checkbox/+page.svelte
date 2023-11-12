<script>
  import { Checkbox, CheckboxGroup } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Checkbox</h2>

<section>
  <h3>Horizontal</h3>
  <Example>
    <div>
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox name="ingredients" value="rice" checked>Rice</Checkbox>
        <Checkbox name="ingredients" value="beans" checked={false}>Beans</Checkbox>
        <Checkbox name="ingredients" value="cheese" checked="mixed">Cheese</Checkbox>
        <Checkbox name="ingredients" value="cheese" disabled>Disabled</Checkbox>
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <Example>
    <div>
      <CheckboxGroup aria-label="Ingredients" orientation="vertical">
        <Checkbox name="ingredients" value="rice" checked>Rice</Checkbox>
        <Checkbox name="ingredients" value="beans" checked={false}>Beans</Checkbox>
        <Checkbox name="ingredients" value="cheese" checked="mixed">Cheese</Checkbox>
        <Checkbox name="ingredients" value="cheese" disabled>Lettuce</Checkbox>
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <CheckboxGroup aria-label="Ingredients" disabled>
        <Checkbox name="ingredients" value="rice" checked>Rice</Checkbox>
        <Checkbox name="ingredients" value="beans" checked={false}>Beans</Checkbox>
        <Checkbox name="ingredients" value="cheese" checked="mixed">Cheese</Checkbox>
        <Checkbox name="ingredients" value="cheese" disabled>Lettuce</Checkbox>
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox name="ingredients" value="rice" checked readonly>Rice</Checkbox>
        <Checkbox name="ingredients" value="beans" checked={false} readonly>Beans</Checkbox>
        <Checkbox name="ingredients" value="cheese" checked="mixed" readonly>Cheese</Checkbox>
        <Checkbox name="ingredients" value="cheese" readonly>Lettuce</Checkbox>
      </CheckboxGroup>
    </div>
  </Example>
</section>
