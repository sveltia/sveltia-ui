<script>
  import { CodeEditor } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Code Editor</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <CodeEditor />
    </div>
  </Example>
</section>

<section>
  <h3>Language Switcher + Default Language</h3>
  <Example>
    <div role="none">
      <CodeEditor showLanguageSwitcher={true} defaultLanguage="javascript" />
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <CodeEditor invalid />
    </div>
  </Example>
  <Example>
    <div role="none">
      <CodeEditor invalid showLanguageSwitcher={true} defaultLanguage="javascript" />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <CodeEditor disabled />
    </div>
  </Example>
  <Example>
    <div role="none">
      <CodeEditor disabled showLanguageSwitcher={true} defaultLanguage="javascript" />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <CodeEditor readonly />
    </div>
  </Example>
  <Example>
    <div role="none">
      <CodeEditor readonly showLanguageSwitcher={true} defaultLanguage="javascript" />
    </div>
  </Example>
</section>
