<script>
  import { TextEditor } from '$lib';
  import Example from '../../_components/example.svelte';

  const markdown = [
    '# Heading',
    '',
    'Some **bold**, _italic_ and `code` text with a [link](https://example.com).',
    '',
    '- List item',
    '- Another item',
    '',
    '> Quote',
    '',
    '```js',
    'const answer = 42;',
    '```',
  ].join('\n');
</script>

<svelte:head>
  <title>Text Editor – Sveltia UI</title>
</svelte:head>

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
  <h3>Limited Buttons</h3>
  <Example>
    <div role="none">
      <TextEditor buttons={['bold', 'italic', 'strikethrough', 'code']} />
    </div>
  </Example>
</section>

<section>
  <h3>Without Emoji Autocomplete</h3>
  <Example>
    <div role="none">
      <TextEditor useEmojiAutocomplete={false} />
    </div>
  </Example>
</section>

<section>
  <h3>Plain Text Mode by Default</h3>
  <Example>
    <div role="none">
      <TextEditor modes={['plain-text', 'rich-text']} value={markdown} />
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <TextEditor invalid />
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
