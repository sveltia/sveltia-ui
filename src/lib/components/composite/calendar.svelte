<script>
  import { _ } from 'svelte-i18n';
  import Button from '../core/button.svelte';
  import Icon from '../core/icon.svelte';
  import MenuButton from '../core/menu-button.svelte';
  import Separator from '../core/separator.svelte';
  import Spacer from '../core/spacer.svelte';

  /** @type {(String|undefined)} */
  export let value = undefined;

  const dayList = [];
  const weeks = [];
  const now = new Date();

  $: date = value ? new Date(value) : now;
  $: firstDayOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
  $: firstDay = new Date(firstDayOfMonth);

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
  <div class="header">
    <MenuButton
      class="ternary"
      label={firstDay.toLocaleDateString('en', { year: 'numeric', month: 'short' })}
      iconName="arrow_drop_down"
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="popup-inner" on:click|stopPropagation>
        <div role="group" aria-label={$_('sui.calendar.year')}>
          <div class="header">
            <Button
              on:click={() => {
                //
              }}
            >
              <Icon name="chevron_left" label={$_('sui.calendar.previous_decade')} />
            </Button>
            <Button
              on:click={() => {
                //
              }}
            >
              <Icon name="chevron_right" label={$_('sui.calendar.next_decade')} />
            </Button>
          </div>
          <div class="grid">
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as year}
              <div>
                <Button>202{year}</Button>
              </div>
            {/each}
          </div>
        </div>
        <Separator orientation="vertical" />
        <div role="group" aria-label={$_('sui.calendar.month')}>
          <div class="grid">
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as month}
              <div>
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
    </MenuButton>
    <Button
      on:click={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() - 1);
        firstDay = firstDay;
      }}
    >
      <Icon name="chevron_left" label={$_('sui.calendar.previous_month')} />
    </Button>
    <Button
      on:click={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() + 1);
        firstDay = firstDay;
      }}
    >
      <Icon name="chevron_right" label={$_('sui.calendar.next_month')} />
    </Button>
  </div>
  <div class="grid" role="listbox">
    {#each dayList.slice(0, 7) as { day }}
      <div class="weekday" role="presentation">
        {day.toLocaleDateString('en', { weekday: 'narrow' })}
      </div>
    {/each}
    {#each dayList as { day }}
      <div
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
  <div class="footer">
    <Button
      on:click={() => {
        value = '';
      }}
    >
      {$_('sui.calendar.clear')}
    </Button>
    <Spacer flex={true} />
    <Button
      on:click={() => {
        [value] = now.toJSON().split('T');
      }}
    >
      {$_('sui.calendar.today')}
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
    font-size: 14px;

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
      font-size: 12px;

      &.weekday {
        color: var(--secondary-foreground-color);
      }

      &.other-month {
        color: var(--ternary-foreground-color);
      }

      &.today :global(button) {
        color: var(--highlight-foreground-color);
        background-color: var(--primary-accent-color);
      }

      :global(button) {
        justify-content: center;
        width: 100%;
        height: 24px;
        border-radius: 50%;

        &:hover {
          background-color: var(--highlight-background-color);
        }

        &:focus {
          border-width: 1px;
          border-color: var(--primary-accent-color-lighter);
        }
      }
    }
  }

  .footer {
    :global(button) {
      font-size: 12px;
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
