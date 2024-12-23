<script>
  import { NumberInput, PasswordInput, SearchBar, TextArea, TextInput } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Text Field</h2>

<section>
  <h3>Single line</h3>
  <Example>
    <div role="none">
      <TextInput />
    </div>
  </Example>
</section>

<section>
  <h3>Password</h3>
  <Example>
    <div role="none">
      <PasswordInput />
    </div>
  </Example>
</section>

<section>
  <h3>Number</h3>
  <Example>
    <div role="none">
      <NumberInput min={0} />
    </div>
  </Example>
</section>

<section>
  <h3>Search</h3>
  <Example>
    <div role="none">
      <SearchBar />
    </div>
  </Example>
</section>

<section>
  <h3>Multi line</h3>
  <Example>
    <div role="none">
      <TextArea />
    </div>
  </Example>
</section>

<section>
  <h3>Multi line, auto resize</h3>
  <Example>
    <div role="none">
      <TextArea autoResize />
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
  <h3>Flex</h3>
  <Example>
    <div role="none">
      <TextInput flex />
    </div>
    <div role="none">
      <PasswordInput flex />
    </div>
    <div role="none">
      <NumberInput min={0} flex />
    </div>
    <div role="none">
      <SearchBar flex />
    </div>
    <div role="none">
      <TextArea flex />
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <TextInput invalid />
    </div>
    <div role="none">
      <PasswordInput invalid />
    </div>
    <div role="none">
      <NumberInput min={0} invalid />
    </div>
    <div role="none">
      <SearchBar invalid />
    </div>
    <div role="none">
      <TextArea invalid />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <TextInput disabled />
    </div>
    <div role="none">
      <PasswordInput disabled />
    </div>
    <div role="none">
      <NumberInput min={0} disabled />
    </div>
    <div role="none">
      <SearchBar disabled />
    </div>
    <div role="none">
      <TextArea disabled />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <TextInput readonly />
    </div>
    <div role="none">
      <PasswordInput readonly />
    </div>
    <div role="none">
      <NumberInput min={0} readonly />
    </div>
    <div role="none">
      <SearchBar readonly />
    </div>
    <div role="none">
      <TextArea readonly />
    </div>
  </Example>
</section>
