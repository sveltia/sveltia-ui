<script>
  import { Calendar } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Date/Time</h2>

<section>
  <h3>Calendar (WIP)</h3>
  <Example>
    <Calendar />
  </Example>
</section>

<section>
  <h3>Date Picker (native)</h3>
  <Example>
    <div role="none">
      <input type="datetime-local" />
    </div>
    <div role="none">
      <input type="date" />
    </div>
    <div role="none">
      <input type="time" />
    </div>
  </Example>
</section>
