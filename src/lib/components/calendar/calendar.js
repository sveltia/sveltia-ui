import { date as formatLocaleDate } from '@sveltia/i18n';

/**
 * Date helpers behind `<Calendar>`, kept apart from the component so the grid can be tested without
 * rendering anything.
 */

/**
 * Format a date in the current locale. Falls back to the browser’s locale if `@sveltia/i18n` has
 * not been initialized yet, in which case its formatter has no locale to work with and throws.
 * @param {Date} value Date to format.
 * @param {Intl.DateTimeFormatOptions} options Formatting options.
 * @returns {string} Formatted date.
 */
export const formatDate = (value, options) => {
  try {
    return formatLocaleDate(value, options);
  } catch {
    return value.toLocaleDateString(undefined, options);
  }
};

/**
 * Number of cells in the day grid: six weeks, enough to show any month in full from the Sunday on
 * or before its first day.
 */
export const DAY_GRID_SIZE = 42;

/**
 * List of month names for the month selector. We use a fixed date to avoid issues with daylight
 * saving time.
 * @type {string[]}
 */
export const MONTH_NAMES = Array.from({ length: 12 }, (__, i) =>
  new Date(2000, i, 10).toLocaleDateString('en', { month: 'short' }),
);

/**
 * Get the first day of the month the given date is in.
 * @param {Date} date Any date within the month.
 * @returns {Date} UTC midnight on the first day of the month, using the UTC year and month of the
 * given date, so a date parsed from a `YYYY-MM-DD` string lands in the right month regardless of
 * the time zone. The whole grid is UTC-based, like the `value`.
 */
export const getFirstDayOfMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

/**
 * Get the first day of another month, relative to the given one.
 * @param {Date} firstDay First day of a month.
 * @param {number} delta Number of months to move by; negative to go back.
 * @returns {Date} A new date, `delta` months away.
 */
export const addMonths = (firstDay, delta) => {
  const date = new Date(firstDay);

  date.setUTCMonth(date.getUTCMonth() + delta);

  return date;
};

/**
 * Get the days to be laid out in the calendar grid.
 * @param {Date} firstDay First day of the month being displayed.
 * @returns {Date[]} {@link DAY_GRID_SIZE} consecutive days, starting from the Sunday on or before
 * `firstDay`, so the days from the previous and next months fill the grid.
 */
export const getCalendarDays = (firstDay) => {
  const cursor = new Date(firstDay);

  // Start from Sunday
  cursor.setUTCDate(1 - cursor.getUTCDay());

  return Array.from({ length: DAY_GRID_SIZE }, () => {
    const day = new Date(cursor);

    cursor.setUTCDate(cursor.getUTCDate() + 1);

    return day;
  });
};

/**
 * Format a date as the `value` of the calendar.
 * @param {Date} date Date.
 * @returns {string} Date in the `YYYY-MM-DD` format, based on UTC.
 */
export const toDateString = (date) => date.toJSON().split('T')[0];

/**
 * Get today’s local calendar day as a UTC-based date, so it can be compared with the days on the
 * grid and turned into a `value` with {@link toDateString}.
 * @param {Date} [now] Current date and time.
 * @returns {Date} UTC midnight on today’s local date.
 */
export const getToday = (now = new Date()) =>
  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
