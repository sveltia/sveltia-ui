<script>
  import { TextEditor } from '$lib';
  import Example from '../../_components/example.svelte';
  import { calloutComponent, imageComponent, youtubeComponent } from './demo-components.js';

  const components = [imageComponent, calloutComponent, youtubeComponent];

  const componentMarkdown = [
    'Some text with an image: ![Sveltia](https://github.com/sveltia.png)',
    '',
    ':::tip',
    'Try the Insert menu in both modes.',
    ':::',
  ].join('\n');

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
  <h3>With Components</h3>
  <Example>
    <div role="none">
      <TextEditor {components} value={componentMarkdown} />
    </div>
  </Example>
</section>

<section>
  <h3>Plain Text Mode by Default</h3>
  <Example>
    <div role="none">
      <TextEditor modes={['plain-text', 'rich-text']} value={markdown} {components} />
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

<style lang="scss">
  :global(.demo-component) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
    border: 1px solid var(--sui-secondary-border-color);
    border-radius: 4px;
    padding: 4px 8px;
    background-color: var(--sui-secondary-background-color);

    &:global(.block) {
      display: flex;
    }

    :global(.title) {
      font-weight: var(--sui-font-weight-bold, bold);
    }

    :global(label) {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    :global(:is(input, select, textarea)) {
      border: 1px solid var(--sui-textbox-border-color);
      border-radius: 4px;
      padding: 2px 4px;
      color: inherit;
      background-color: var(--sui-textbox-background-color);
      font: inherit;
    }
  }
</style>
