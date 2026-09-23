<!--
  @component
  A calendar (date picker) widget.
-->
<script>
  import { _, isRTL } from '@sveltia/i18n';
  import { tick } from 'svelte';
  import { activateGroup } from '../../services/group.svelte.js';
  import Button from '../button/button.svelte';
  import Divider from '../divider/divider.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';
  import {
    addMonths,
    formatDate,
    getCalendarDays,
    getFirstDayOfMonth,
    isSameDay,
    MONTH_NAMES,
    toDateString,
  } from './calendar.js';

  /**
   * @typedef {object} Props
   * @property {string} [value] Date.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let { value = $bindable(undefined) } = $props();

  const now = new Date();

  const date = $derived(value ? new Date(value) : now);
  /**
   * First day of the month being displayed. Follows the {@link value}, and is reassigned by the
   * month navigation below.
   * @type {Date}
   */
  let firstDay = $derived(getFirstDayOfMonth(date));
  const dayList = $derived(getCalendarDays(firstDay).map((day) => ({ day })));
  /**
   * Month and year being displayed, in the current locale. It’s the caption of the day grid as
   * well as the label of the month switcher.
   */
  const monthLabel = $derived(formatDate(firstDay, { year: 'numeric', month: 'short' }));
  const id = $props.id();
  /** @type {HTMLElement | undefined} */
  let grid = $state();

  // Keep the keyboard cursor on the selected day. The group service tracks the cursor with the
  // `focused` class and `aria-activedescendant`, and moves both along with the selection it makes
  // itself; this covers the starting point and a `value` set from outside, which may land in
  // another month while the cell the cursor was on is still on the grid.
  $effect(() => {
    void value;

    // The grid is bound before any effect runs
    /* v8 ignore next */
    if (!grid) {
      return;
    }

    const listbox = grid;

    tick().then(() => {
      const option = listbox.querySelector('[role="option"][aria-selected="true"]');

      if (!option || option.classList.contains('focused')) {
        return;
      }

      listbox.querySelectorAll('.focused').forEach((element) => {
        element.classList.remove('focused');
      });
      option.classList.add('focused');
      listbox.setAttribute('aria-activedescendant', option.id);
    });
  });
</script>

<div role="group">
  <input type="hidden" bind:value />
  <div role="none" class="header">
    <Button variant="ghost" label={monthLabel} aria-haspopup="dialog">
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
                  <Button>{`202${year}`}</Button>
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
        firstDay = addMonths(firstDay, -1);
      }}
    >
      <Icon name="chevron_left" />
    </Button>
    <Button
      aria-label={_('_sui.calendar.next_month')}
      onclick={() => {
        firstDay = addMonths(firstDay, 1);
      }}
    >
      <Icon name={isRTL() ? 'chevron_left' : 'chevron_right'} />
    </Button>
  </div>
  <!--
    The day grid is a listbox laid out as a grid, so the group service moves through it with all
    four arrow keys. Each day is named by its full date: the digit alone means nothing out of
    context. The days are UTC-based, like the `value`, so the names are formatted the same way.
    The cells are keyed by date string rather than by `Date` object, which is recreated on every
    update: a day that stays on the grid when the month changes — the last days of the previous
    month, say — keeps its element, and with it the keyboard cursor.
  -->
  <div
    bind:this={grid}
    role="listbox"
    class="grid"
    aria-label={monthLabel}
    onChange={(/** @type {CustomEvent} */ event) => {
      value = event.detail.value;
    }}
    {@attach activateGroup()}
  >
    {#each dayList.slice(0, 7) as { day } (day.getUTCDay())}
      <div role="none" class="weekday">
        {formatDate(day, { weekday: 'narrow' })}
      </div>
    {/each}
    {#each dayList as { day } (toDateString(day))}
      {@const dateString = toDateString(day)}
      <div
        role="none"
        class:other-month={day.getUTCMonth() !== firstDay.getUTCMonth()}
        class:today={isSameDay(day, now)}
      >
        <Button
          role="option"
          id="{id}-{dateString}"
          value={dateString}
          aria-label={formatDate(day, { dateStyle: 'full', timeZone: 'UTC' })}
          aria-selected={dateString === value}
          onclick={() => {
            value = dateString;
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
        value = toDateString(now);
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

      // Today is marked with a ring so it isn’t mistaken for the selected day, which is filled
      &.today :global(button) {
        border-width: 1px;
        border-color: var(--sui-primary-accent-color);
        color: var(--sui-primary-accent-color-text);
      }

      :global {
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

          &[aria-selected='true'] {
            color: var(--sui-highlight-foreground-color);
            background-color: var(--sui-primary-accent-color);
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
