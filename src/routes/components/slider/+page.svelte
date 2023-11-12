<script>
  import { Slider } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Slider</h2>

<section>
  <h3>Single Thumb</h3>
  <Example>
    <div>
      <Slider />
    </div>
  </Example>
</section>

<section>
  <h3>Multi Thumb</h3>
  <Example>
    <div>
      <Slider values={[1, 5]} min={1} max={5} step={0.1} optionLabels={[1, 2, 3, 4, 5]} />
    </div>
    <div>
      <Slider values={[0, 24]} min={0} max={24} step={3} optionLabels={[0, 6, 12, 18, 24]} />
    </div>
  </Example>
</section>

<section>
  <h3>Non-Linear</h3>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <Slider disabled />
    </div>
    <div>
      <Slider
        values={[0, 24]}
        min={0}
        max={24}
        step={3}
        optionLabels={[0, 6, 12, 18, 24]}
        disabled
      />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <Slider readonly />
    </div>
    <div>
      <Slider
        values={[0, 24]}
        min={0}
        max={24}
        step={3}
        optionLabels={[0, 6, 12, 18, 24]}
        readonly
      />
    </div>
  </Example>
</section>
