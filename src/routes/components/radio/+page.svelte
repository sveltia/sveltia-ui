<script>
  import { Radio, RadioGroup } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Radio</h2>

<section>
  <h3>Horizontal</h3>
  <Example>
    <div>
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
  <h3>Vertical</h3>
  <Example>
    <div>
      <RadioGroup orientation="vertical">
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
    <div>
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
    <div>
      <RadioGroup readonly>
        <Radio checked label="Strawberry" />
        <Radio label="Grape" />
        <Radio label="Lemon" />
        <Radio disabled label="Orange" />
      </RadioGroup>
    </div>
  </Example>
</section>
