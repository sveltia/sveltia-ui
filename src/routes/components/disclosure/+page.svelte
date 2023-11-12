<script>
  import { Disclosure } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Disclosure</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div>
      <Disclosure label="Event Details">Details?</Disclosure>
    </div>
  </Example>
</section>

<section>
  <h3>Default</h3>
  <Example>
    <div>
      <Disclosure label="Event Details" disabled>Details?</Disclosure>
    </div>
  </Example>
</section>
