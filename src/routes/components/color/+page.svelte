<script>
  import { ColorInput } from '#lib';
  import Example from '../../_components/example.svelte';

  let value = $state('#3366cc');
</script>

<svelte:head>
  <title>Colour Picker – Sveltia UI</title>
</svelte:head>

<h2>Colour Picker</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <ColorInput bind:value aria-label="Colour" />
    </div>
    <div role="none">Value: {value}</div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <ColorInput value="#cc3333" invalid aria-label="Colour" />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <ColorInput value="#33cc66" disabled aria-label="Colour" />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <ColorInput value="#9933cc" readonly aria-label="Colour" />
    </div>
  </Example>
</section>
