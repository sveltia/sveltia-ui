<script>
  import { MarkdownEditor, NumberInput, PasswordInput, SearchBar, TextArea, TextInput } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Text Field</h2>

<section>
  <h3>Single line</h3>
  <Example>
    <div>
      <TextInput />
    </div>
  </Example>
</section>

<section>
  <h3>Multi line</h3>
  <Example>
    <div>
      <TextArea />
    </div>
  </Example>
</section>

<section>
  <h3>Password</h3>
  <Example>
    <div>
      <PasswordInput />
    </div>
  </Example>
</section>

<section>
  <h3>Number</h3>
  <Example>
    <div>
      <NumberInput min={0} />
    </div>
  </Example>
</section>

<section>
  <h3>Search</h3>
  <Example>
    <div>
      <SearchBar />
    </div>
  </Example>
</section>

<section>
  <h3>Credit Card</h3>
</section>

<section>
  <h3>PIN/2FA</h3>
</section>

<section>
  <h3>Editor (WIP)</h3>
  <Example>
    <div>
      <MarkdownEditor />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <TextInput disabled />
    </div>
    <div>
      <TextArea disabled />
    </div>
    <div>
      <PasswordInput disabled />
    </div>
    <div>
      <NumberInput min={0} disabled />
    </div>
    <div>
      <SearchBar disabled />
    </div>
    <div>
      <MarkdownEditor disabled />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div>
      <TextInput readonly />
    </div>
    <div>
      <TextArea readonly />
    </div>
    <div>
      <PasswordInput readonly />
    </div>
    <div>
      <NumberInput min={0} readonly />
    </div>
    <div>
      <SearchBar readonly />
    </div>
    <div>
      <MarkdownEditor readonly />
    </div>
  </Example>
</section>
