<script>
  import { Switch } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Switch</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div>
      <Switch>Option 3</Switch>
    </div>
  </Example>
</section>

<section>
  <h3>Checked</h3>
  <Example>
    <div>
      <Switch checked>Option 3</Switch>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <Switch disabled>Option 3</Switch>
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <Switch readonly>Option 3</Switch>
    </div>
  </Example>
</section>
