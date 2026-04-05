<!--
  @component
  A calendar (date picker) widget.
-->
<script>
  import { _, isRTL } from '@sveltia/i18n';
  import { SvelteDate } from 'svelte/reactivity';
  import Button from '../button/button.svelte';
  import Divider from '../divider/divider.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [value] Date.
   */

  /**
   * List of month names for month selector. We use a fixed date to avoid issues with daylight
   * saving time.
   */
  const MONTH_NAMES = Array.from({ length: 12 }, (__, i) =>
    new Date(2000, i, 10).toLocaleDateString('en', { month: 'short' }),
  );

  /**
   * @type {Props & Record<string, any>}
   */
  let { value = $bindable(undefined) } = $props();

  const now = new Date();

  const date = $derived(value ? new Date(value) : now);
  const firstDayOfMonth = $derived(new Date(date.getUTCFullYear(), date.getUTCMonth(), 1));
  // eslint-disable-next-line svelte/prefer-writable-derived
  let firstDay = $state();

  $effect(() => {
    firstDay = new SvelteDate(firstDayOfMonth);
  });

  const dayList = $derived.by(() => {
    if (!firstDay) return [];

    const cursor = new SvelteDate(firstDay);

    // Start from Sunday
    cursor.setDate(1 - cursor.getUTCDay());

    return Array.from({ length: 42 }, () => {
      const day = new Date(cursor);

      cursor.setUTCDate(cursor.getUTCDate() + 1);

      return { day };
    });
  });
</script>

<div role="group">
  <input type="hidden" bind:value />
  <div role="none" class="header">
    <Button
      variant="ghost"
      label={firstDay?.toLocaleDateString('en', { year: 'numeric', month: 'short' })}
      aria-haspopup="dialog"
    >
      {#snippet endIcon()}
        <Icon name="arrow_drop_down" class="small-arrow" />
      {/snippet}
      {#snippet popup()}
        <div
          role="none"
          class="popup-inner"
          onclick={(event) => {
            event.stopPropagation();
          }}
        >
          <div role="group" aria-label={_('_sui.calendar.year')}>
            <div role="none" class="header">
              <Button
                aria-label={_('_sui.calendar.previous_decade')}
                onclick={() => {
                  //
                }}
              >
                <Icon name="chevron_left" />
              </Button>
              <Button
                aria-label={_('_sui.calendar.next_decade')}
                onclick={() => {
                  //
                }}
              >
                <Icon name={isRTL() ? 'chevron_left' : 'chevron_right'} />
              </Button>
            </div>
            <div role="none" class="grid">
              {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as year (year)}
                <div role="none">
                  <Button>202{year}</Button>
                </div>
              {/each}
            </div>
          </div>
          <Divider orientation="vertical" />
          <div role="group" aria-label={_('_sui.calendar.month')}>
            <div role="none" class="grid">
              {#each MONTH_NAMES as monthName (monthName)}
                <div role="none">
                  <Button>{monthName}</Button>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/snippet}
    </Button>
    <Button
      aria-label={_('_sui.calendar.previous_month')}
      onclick={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() - 1);
        firstDay = firstDay;
      }}
    >
      <Icon name="chevron_left" />
    </Button>
    <Button
      aria-label={_('_sui.calendar.next_month')}
      onclick={() => {
        firstDay.setUTCMonth(firstDay.getUTCMonth() + 1);
        firstDay = firstDay;
      }}
    >
      <Icon name={isRTL() ? 'chevron_left' : 'chevron_right'} />
    </Button>
  </div>
  <div role="listbox" class="grid">
    {#each dayList.slice(0, 7) as { day } (day)}
      <div role="none" class="weekday">
        {day.toLocaleDateString('en', { weekday: 'narrow' })}
      </div>
    {/each}
    {#each dayList as { day } (day)}
      <div
        role="none"
        class:other-month={day.getUTCMonth() !== firstDay?.getUTCMonth()}
        class:today={day.getFullYear() === now.getFullYear() &&
          day.getMonth() === now.getMonth() &&
          day.getDate() === now.getDate()}
      >
        <Button
          role="option"
          aria-selected={false}
          onclick={() => {
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
      onclick={() => {
        value = '';
      }}
    >
      {_('_sui.clear')}
    </Button>
    <Spacer flex={true} />
    <Button
      onclick={() => {
        [value] = now.toJSON().split('T');
      }}
    >
      {_('_sui.calendar.today')}
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

  :is(.header, .footer) {
    display: flex;
    gap: 8px;
    height: 24px;
    align-items: center;

    :global {
      button.secondary {
        width: 100px;
        flex: auto;
      }
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

      :global {
        &.today button {
          color: var(--sui-highlight-foreground-color);
          background-color: var(--sui-primary-accent-color);
        }

        button {
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
  }

  .footer {
    :global {
      button {
        font-size: var(--sui-font-size-small);
      }
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
