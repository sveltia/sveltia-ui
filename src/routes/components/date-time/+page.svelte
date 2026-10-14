<script>
  import { Calendar, DateTimeInput } from '#lib';
  import Example from '../../_components/example.svelte';

  let date = $state('2026-10-14');
  let dateTime = $state('');
  let time = $state('');
</script>

<svelte:head>
  <title>Date/Time – Sveltia UI</title>
</svelte:head>

<h2>Date/Time</h2>

<section>
  <h3>Calendar (WIP)</h3>
  <Example>
    <Calendar />
  </Example>
</section>

<section>
  <h3>Date</h3>
  <Example>
    <div role="none">
      <DateTimeInput bind:value={date} aria-label="Date" />
    </div>
    <div role="none">Value: {date}</div>
  </Example>
</section>

<section>
  <h3>Date and time</h3>
  <Example>
    <div role="none">
      <DateTimeInput type="datetime-local" bind:value={dateTime} aria-label="Date and time" />
    </div>
    <div role="none">Value: {dateTime}</div>
  </Example>
</section>

<section>
  <h3>Time</h3>
  <Example>
    <div role="none">
      <DateTimeInput type="time" bind:value={time} aria-label="Time" />
    </div>
    <div role="none">Value: {time}</div>
  </Example>
</section>

<section>
  <h3>Time with seconds</h3>
  <Example>
    <div role="none">
      <DateTimeInput type="time" step={1} aria-label="Time with seconds" />
    </div>
  </Example>
</section>

<section>
  <h3>Range</h3>
  <Example>
    <div role="none">
      <DateTimeInput min="2026-01-01" max="2026-12-31" aria-label="Date in 2026" />
    </div>
  </Example>
</section>

<section>
  <h3>Invalid</h3>
  <Example>
    <div role="none">
      <DateTimeInput invalid aria-label="Date" />
    </div>
    <div role="none">
      <DateTimeInput type="datetime-local" invalid aria-label="Date and time" />
    </div>
    <div role="none">
      <DateTimeInput type="time" invalid aria-label="Time" />
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <DateTimeInput value="2026-10-14" disabled aria-label="Date" />
    </div>
    <div role="none">
      <DateTimeInput type="datetime-local" disabled aria-label="Date and time" />
    </div>
    <div role="none">
      <DateTimeInput type="time" value="13:30" disabled aria-label="Time" />
    </div>
  </Example>
</section>

<section>
  <h3>Read-only</h3>
  <Example>
    <div role="none">
      <DateTimeInput value="2026-10-14" readonly aria-label="Date" />
    </div>
    <div role="none">
      <DateTimeInput
        type="datetime-local"
        value="2026-10-14T13:30"
        readonly
        aria-label="Date and time"
      />
    </div>
    <div role="none">
      <DateTimeInput type="time" value="13:30" readonly aria-label="Time" />
    </div>
  </Example>
</section>
