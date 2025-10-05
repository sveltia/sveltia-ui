<script>
  import { Radio, RadioGroup } from '$lib';
  import Example from '../../_components/example.svelte';

  let fruit = $state('');
</script>

<h2>Radio</h2>

<section>
  <h3>Horizontal</h3>
  <Example>
    <div role="none">
      <RadioGroup>
        <Radio label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <Example>
    <div role="none">
      <RadioGroup orientation="vertical">
        <Radio label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Default checked</h3>
  <Example>
    <div role="none">
      <RadioGroup>
        <Radio checked label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <RadioGroup invalid>
        <Radio checked label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <RadioGroup disabled>
        <Radio checked label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <RadioGroup readonly>
        <Radio checked label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Group binding</h3>
  <Example>
    <div role="none">
      <RadioGroup>
        <Radio label="Strawberry" value="strawberry" bind:group={fruit} />
        <Radio label="Grape" value="grape" bind:group={fruit} />
        <Radio label="Lemon" value="lemon" bind:group={fruit} />
        <Radio disabled label="Orange" value="orange" bind:group={fruit} />
      </RadioGroup>
    </div>
    <div role="none">
      Selected fruit: {fruit}
    </div>
  </Example>
</section>
