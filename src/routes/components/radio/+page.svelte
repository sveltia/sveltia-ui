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
        <Radio checked>Strawberry</Radio>
        <Radio>Grape</Radio>
        <Radio>Lemon</Radio>
        <Radio disabled>Orange</Radio>
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Vertical</h3>
  <Example>
    <div>
      <RadioGroup orientation="vertical">
        <Radio checked>Strawberry</Radio>
        <Radio>Grape</Radio>
        <Radio>Lemon</Radio>
        <Radio disabled>Orange</Radio>
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <RadioGroup disabled>
        <Radio checked>Strawberry</Radio>
        <Radio>Grape</Radio>
        <Radio>Lemon</Radio>
        <Radio disabled>Orange</Radio>
      </RadioGroup>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <RadioGroup readonly>
        <Radio checked>Strawberry</Radio>
        <Radio>Grape</Radio>
        <Radio>Lemon</Radio>
        <Radio disabled>Orange</Radio>
      </RadioGroup>
    </div>
  </Example>
</section>
