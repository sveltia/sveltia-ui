<script>
  import { Alert, Icon } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Inline Alert</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Alert status="error">Error</Alert>
    </div>
    <div role="none">
      <Alert status="warning">Warning</Alert>
    </div>
    <div role="none">
      <Alert status="info">Info</Alert>
    </div>
    <div role="none">
      <Alert status="success">Success</Alert>
    </div>
  </Example>
</section>

<section>
  <h3>With Custom Icons</h3>
  <Example>
    <div role="none">
      <Alert status="error">
        {#snippet icon()}
          <Icon name="dangerous" />
        {/snippet}
        Error
      </Alert>
    </div>
    <div role="none">
      <Alert status="warning">
        {#snippet icon()}
          <Icon name="emergency_home" />
        {/snippet}
        Warning
      </Alert>
    </div>
    <div role="none">
      <Alert status="info">
        {#snippet icon()}
          <Icon name="help" />
        {/snippet}
        Info
      </Alert>
    </div>
    <div role="none">
      <Alert status="success">
        {#snippet icon()}
          <Icon name="verified" />
        {/snippet}
        Success
      </Alert>
    </div>
  </Example>
</section>
