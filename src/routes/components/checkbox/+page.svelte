<script>
  import { Checkbox, CheckboxGroup } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Checkbox</h2>

<section>
  <h3>Horizontal</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox name="ingredients" value="rice" checked label="Rice" />
        <Checkbox name="ingredients" value="beans" checked={false} label="Beans" />
        <Checkbox name="ingredients" value="cheese" checked="mixed" label="Cheese" />
        <Checkbox name="ingredients" value="cheese" disabled label="Disabled" />
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients" orientation="vertical">
        <Checkbox name="ingredients" value="rice" checked label="Rice" />
        <Checkbox name="ingredients" value="beans" checked={false} label="Beans" />
        <Checkbox name="ingredients" value="cheese" checked="mixed" label="Cheese" />
        <Checkbox name="ingredients" value="cheese" disabled label="Lettuce" />
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox name="ingredients" value="rice" checked label="Rice" invalid />
        <Checkbox name="ingredients" value="beans" checked={false} label="Beans" invalid />
        <Checkbox name="ingredients" value="cheese" checked="mixed" label="Cheese" invalid />
        <Checkbox name="ingredients" value="cheese" disabled label="Lettuce" invalid />
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients" disabled>
        <Checkbox name="ingredients" value="rice" checked label="Rice" />
        <Checkbox name="ingredients" value="beans" checked={false} label="Beans" />
        <Checkbox name="ingredients" value="cheese" checked="mixed" label="Cheese" />
        <Checkbox name="ingredients" value="cheese" disabled label="Lettuce" />
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox name="ingredients" value="rice" checked readonly label="Rice" />
        <Checkbox name="ingredients" value="beans" checked={false} readonly label="Beans" />
        <Checkbox name="ingredients" value="cheese" checked="mixed" readonly label="Cheese" />
        <Checkbox name="ingredients" value="cheese" readonly label="Lettuce" />
      </CheckboxGroup>
    </div>
  </Example>
</section>
