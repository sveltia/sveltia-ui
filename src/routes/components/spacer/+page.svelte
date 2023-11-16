<script>
  import { Spacer } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Spacer</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Spacer />
    </div>
  </Example>
</section>

<section>
  <h3>Flex</h3>
  <Example>
    <div role="none">
      <Spacer flex />
    </div>
  </Example>
</section>
