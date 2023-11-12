<script>
  import { Button, Icon } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Button</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div>
      <Button variant="primary" label="Primary" />
      <Button variant="secondary" label="Secondary" />
      <Button variant="tertiary" label="Tertiary" />
      <Button variant="ghost" label="Ghost" />
    </div>
  </Example>
</section>
<section>
  <h3>Link</h3>
  <Example>
    <!-- cSpell:disable -->
    <div>
      <Button
        variant="link"
        label="Link: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Nam pulvinar scelerisque tincidunt."
      />
    </div>
    <div>
      <Button variant="link" label="Link: Lorem ipsum dolor sit amet">
        <Icon name="help" slot="start-icon" />
      </Button>
    </div>
    <!-- cSpell:enable -->
  </Example>
</section>

<section>
  <h3>Size</h3>
  <Example>
    <div>
      <Button variant="primary" size="small" label="Small" />
    </div>
    <div>
      <Button variant="primary" size="medium" label="Medium" />
    </div>
    <div>
      <Button variant="primary" size="large" label="Large" />
    </div>
  </Example>
</section>

<section>
  <h3>Pill</h3>
  <Example>
    <Button variant="primary" pill label="Primary" />
    <Button variant="secondary" pill label="Secondary" />
    <Button variant="tertiary" pill label="Tertiary" />
  </Example>
</section>

<section>
  <h3>With Icon</h3>
  <Example>
    <div>
      <Button variant="secondary" label="Tag">
        <Icon slot="start-icon" name="sell" />
      </Button>
      <Button variant="primary" label="Add">
        <Icon slot="end-icon" name="add" />
      </Button>
      <Button variant="secondary" iconic>
        <Icon slot="end-icon" name="delete" label="Delete" />
      </Button>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <Button variant="primary" label="Primary" disabled />
      <Button variant="secondary" label="Secondary" disabled />
      <Button variant="tertiary" label="Tertiary" disabled />
      <Button variant="ghost" label="Ghost" disabled />
    </div>
    <!-- cSpell:disable -->
    <div>
      <Button
        variant="link"
        disabled
        label="Link: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Nam pulvinar scelerisque tincidunt."
      />
    </div>
    <!-- cSpell:enable -->
    <div>
      <Button variant="secondary" label="Tag" disabled>
        <Icon slot="start-icon" name="sell" />
      </Button>
      <Button variant="primary" label="Add" disabled>
        <Icon slot="end-icon" name="add" />
      </Button>
      <Button variant="secondary" iconic disabled>
        <Icon slot="end-icon" name="delete" label="Delete" />
      </Button>
    </div>
  </Example>
</section>
