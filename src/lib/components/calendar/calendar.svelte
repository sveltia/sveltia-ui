<!--
  @component
  A calendar (date picker) widget.
-->
<script>
  import { _ } from 'svelte-i18n';
  import Button from '$lib/components/button/button.svelte';
  import Divider from '$lib/components/divider/divider.svelte';
  import Spacer from '$lib/components/divider/spacer.svelte';
  import Icon from '$lib/components/icon/icon.svelte';

  /** @type {string | undefined} */
  export let value = undefined;

  /** @type {{ day: Date }[]} */
  const dayList = [];
  /** @type {{ day: Date }[][]} */
  const weeks = [];
  const now = new Date();

  $: date = value ? new Date(value) : now;
  $: firstDayOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
  $: firstDay = new Date(firstDayOfMonth);

  /**
   * Populate {@link weeks} as per the current {@link firstDay}.
   */
  const getWeeks = () => {
    const cursor = new Date(firstDay);

    // Start from Sunday
    cursor.setDate(1 - cursor.getUTCDay());

    for (let i = 0; i < 42; i += 1) {
      const week = Math.floor(i / 7);

      dayList[i] = { day: new Date(cursor) };
      weeks[week] ||= [];
      weeks[week][cursor.getUTCDay() % 7] = { day: new Date(cursor) };
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  };

  $: {
    if (firstDay) {
      getWeeks();
    }
  }
</script>

<div role="group">
  <input type="hidden" bind:value />
  <div role="none" class="header">
    <Button
      variant="ghost"
      label={firstDay.toLocaleDateString('en', { year: 'numeric', month: 'short' })}
      aria-haspopup="dialog"
    >
      <Icon slot="end-icon" name="arrow_drop_down" class="small-arrow" />
      <div slot="popup" role="none" class="popup-inner" on:click|stopPropagation>
        <div role="group" aria-label={$_('_sui.calendar.year')}>
          <div role="none" class="header">
            <Button
              aria-label={$_('_sui.calendar.previous_decade')}
              on:click={() => {
                //
              }}
            >
              <Icon name="chevron_left" />
            </Button>
            <Button
              aria-label={$_('_sui.calendar.next_decade')}
              on:click={() => {
                //
              }}
            >
              <Icon name="chevron_right" />
            </Button>
          </div>
          <div role="none" class="grid">
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as year}
              <div role="none">
                <Button>202{year}</Button>
              </div>
            {/each}
          </div>
        </div>
        <Divider orientation="vertical" />
        <div role="group" aria-label={$_('_sui.calendar.month')}>
          <div role="none" class="grid">
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as month}
              <div role="none">
                <Button>
                  {new Date(date.getUTCFullYear(), month, 10).toLocaleDateString('en', {
                    month: 'short',
                  })}
                </Button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </Button>
    <Button
      aria-label={$_('_sui.calendar.previous_month')}
      on:click={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() - 1);
        firstDay = firstDay;
      }}
    >
      <Icon name="chevron_left" />
    </Button>
    <Button
      aria-label={$_('_sui.calendar.next_month')}
      on:click={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() + 1);
        firstDay = firstDay;
      }}
    >
      <Icon name="chevron_right" />
    </Button>
  </div>
  <div role="listbox" class="grid">
    {#each dayList.slice(0, 7) as { day }}
      <div role="none" class="weekday">
        {day.toLocaleDateString('en', { weekday: 'narrow' })}
      </div>
    {/each}
    {#each dayList as { day }}
      <div
        role="none"
        class:other-month={day.getUTCMonth() !== firstDay.getUTCMonth()}
        class:today={day.getFullYear() === now.getFullYear() &&
          day.getMonth() === now.getMonth() &&
          day.getDate() === now.getDate()}
      >
        <Button
          role="option"
          aria-selected={false}
          on:click={() => {
            [value] = day.toJSON().split('T');
          }}
        >
          {day.getUTCDate()}
        </Button>
      </div>
    {/each}
  </div>
  <div role="none" class="footer">
    <Button
      on:click={() => {
        value = '';
      }}
    >
      {$_('_sui.clear')}
    </Button>
    <Spacer flex={true} />
    <Button
      on:click={() => {
        [value] = now.toJSON().split('T');
      }}
    >
      {$_('_sui.calendar.today')}
    </Button>
  </div>
</div>

<style lang="scss">
  [role='group'] {
    display: inline-flex;
    flex-direction: column;
    gap: 8px;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;

    & > * {
      flex: none;
    }
  }

  .header,
  .footer {
    display: flex;
    gap: 8px;
    height: 24px;
    align-items: center;

    :global(button.secondary) {
      width: 100px;
      flex: auto;
    }
  }

  .grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, 24px);
    gap: 2px;
    width: 180px;

    div {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      font-size: var(--sui-font-size-small);

      &.weekday {
        color: var(--sui-secondary-foreground-color);
      }

      &.other-month {
        color: var(--sui-tertiary-foreground-color);
      }

      &.today :global(button) {
        color: var(--sui-highlight-foreground-color);
        background-color: var(--sui-primary-accent-color);
      }

      :global(button) {
        justify-content: center;
        margin: 0 !important;
        width: 100%;
        height: 24px;
        border-radius: 50%;

        &:hover {
          background-color: var(--sui-hover-background-color);
        }

        &:focus {
          border-width: 1px;
          border-color: var(--sui-primary-accent-color-light);
        }
      }
    }
  }

  .footer {
    :global(button) {
      font-size: var(--sui-font-size-small);
    }
  }

  .popup-inner {
    display: flex;
    gap: 8px;
    padding: 8px;

    [role='group'] {
      gap: 0;

      .header {
        justify-content: center;
      }
    }

    .grid {
      grid-template-columns: repeat(auto-fill, 48px);
      width: calc(48px * 2 + 2px);

      & > div {
        width: 48px;
      }
    }
  }
</style>
