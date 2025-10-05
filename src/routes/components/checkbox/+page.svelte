<script>
  import { Checkbox, CheckboxGroup } from '$lib';
  import Example from '../../_components/example.svelte';

  /** @type {string[]} */
  let ingredients = $state([]);
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
        <Checkbox name="ingredients" value="lettuce" disabled label="Lettuce" />
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
        <Checkbox name="ingredients" value="lettuce" disabled label="Lettuce" />
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
        <Checkbox name="ingredients" value="lettuce" disabled label="Lettuce" invalid />
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
        <Checkbox name="ingredients" value="lettuce" disabled label="Lettuce" />
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
        <Checkbox name="ingredients" value="lettuce" readonly label="Lettuce" />
      </CheckboxGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Group binding</h3>
  <Example>
    <div role="none">
      <CheckboxGroup aria-label="Ingredients">
        <Checkbox value="rice" label="Rice" bind:group={ingredients} />
        <Checkbox value="beans" label="Beans" bind:group={ingredients} />
        <Checkbox value="cheese" label="Cheese" bind:group={ingredients} />
        <Checkbox value="lettuce" disabled label="Lettuce" bind:group={ingredients} />
      </CheckboxGroup>
    </div>
    <div role="none">
      Selected ingredients: {ingredients.join(', ')}
    </div>
  </Example>
</section>
