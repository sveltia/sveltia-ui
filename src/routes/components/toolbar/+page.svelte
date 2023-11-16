<script>
  import { Toolbar } from '$lib';
  import Button from '$lib/components/button/button.svelte';
  import Example from '../../_components/example.svelte';
</script>

<h2>Toolbar</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Toolbar>
        <Button variant="ghost" label="Hello" />
        <Button variant="ghost" label="World" />
      </Toolbar>
    </div>
  </Example>
</section>

<section>
  <h3>Floating</h3>
</section>
