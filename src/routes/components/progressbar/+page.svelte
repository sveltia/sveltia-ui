<script>
  import { Progressbar } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Progressbar</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Progressbar now={50} />
    </div>
  </Example>
</section>

<section>
  <h3>With width</h3>
  <Example>
    <div role="none">
      <Progressbar now={50} --sui-progressbar-width="80px" />
    </div>
  </Example>
</section>
