<script>
  import { TextEditor } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Text Editor</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <TextEditor />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <TextEditor disabled />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <TextEditor readonly />
    </div>
  </Example>
</section>
