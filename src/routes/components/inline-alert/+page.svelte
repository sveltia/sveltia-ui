<script>
  import { Alert, Icon } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Inline Alert</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div>
      <Alert status="error">Error</Alert>
    </div>
    <div>
      <Alert status="warning">Warning</Alert>
    </div>
    <div>
      <Alert status="info">Info</Alert>
    </div>
    <div>
      <Alert status="success">Success</Alert>
    </div>
  </Example>
</section>

<section>
  <h3>With Custom Icons</h3>
  <Example>
    <div>
      <Alert status="error">
        <Icon name="dangerous" slot="icon" />
        Error
      </Alert>
    </div>
    <div>
      <Alert status="warning">
        <Icon name="emergency_home" slot="icon" />
        Warning
      </Alert>
    </div>
    <div>
      <Alert status="info">
        <Icon name="help" slot="icon" />
        Info
      </Alert>
    </div>
    <div>
      <Alert status="success">
        <Icon name="verified" slot="icon" />
        Success
      </Alert>
    </div>
  </Example>
</section>
