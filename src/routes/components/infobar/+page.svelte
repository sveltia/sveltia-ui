<script>
  import { Infobar } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Infobar</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Infobar status="error">Error</Infobar>
    </div>
    <div role="none">
      <Infobar status="warning">Warning</Infobar>
    </div>
    <div role="none">
      <Infobar status="info">Info</Infobar>
    </div>
    <div role="none">
      <Infobar status="success">Success</Infobar>
    </div>
  </Example>
</section>
