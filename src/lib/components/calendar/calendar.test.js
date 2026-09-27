import { date as formatLocaleDate } from '@sveltia/i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addMonths,
  DAY_GRID_SIZE,
  formatDate,
  getCalendarDays,
  getFirstDayOfMonth,
  getToday,
  MONTH_NAMES,
  toDateString,
} from './calendar.js';

vi.mock('@sveltia/i18n', () => ({
  date: vi.fn(),
}));

describe('formatDate', () => {
  it('should format the date with the localized formatter', () => {
    const value = new Date(2024, 2, 1);
    /** @type {Intl.DateTimeFormatOptions} */
    const options = { year: 'numeric', month: 'short' };

    vi.mocked(formatLocaleDate).mockReturnValueOnce('Mar 2024');

    expect(formatDate(value, options)).toBe('Mar 2024');
    expect(formatLocaleDate).toHaveBeenCalledWith(value, options);
  });

  it('should fall back to the browser locale when the formatter is not initialized', () => {
    const value = new Date(2024, 2, 1);
    /** @type {Intl.DateTimeFormatOptions} */
    const options = { year: 'numeric', month: 'short' };

    vi.mocked(formatLocaleDate).mockImplementationOnce(() => {
      throw new Error('No locale');
    });

    expect(formatDate(value, options)).toBe(value.toLocaleDateString(undefined, options));
  });
});

describe('MONTH_NAMES', () => {
  it('should list the twelve short month names in English', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Jan');
    expect(MONTH_NAMES[11]).toBe('Dec');
  });
});

describe('getFirstDayOfMonth', () => {
  it('should return UTC midnight on the first day of the month', () => {
    const first = getFirstDayOfMonth(new Date('2024-03-15T12:00:00Z'));

    expect(first.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });

  it('should use the UTC month, so a date-only value lands in the right month', () => {
    // Parsed as UTC midnight, which is still the previous day in time zones behind UTC
    const first = getFirstDayOfMonth(new Date('2024-03-01'));

    expect(first.getUTCMonth()).toBe(2);
  });
});

describe('addMonths', () => {
  it('should move to the first day of another month', () => {
    const march = new Date('2024-03-01T00:00:00Z');
    const february = addMonths(march, -1);
    const may = addMonths(march, 2);

    expect(february.getUTCMonth()).toBe(1);
    expect(february.getUTCDate()).toBe(march.getUTCDate());
    expect(may.getUTCMonth()).toBe(4);
  });

  it('should cross year boundaries', () => {
    expect(addMonths(new Date('2024-01-01T00:00:00Z'), -1).getUTCFullYear()).toBe(2023);
    expect(addMonths(new Date('2024-12-01T00:00:00Z'), 1).getUTCFullYear()).toBe(2025);
  });

  it('should not modify the given date', () => {
    const march = new Date(2024, 2, 1);

    addMonths(march, 1);
    expect(march.getMonth()).toBe(2);
  });
});

describe('getCalendarDays', () => {
  it('should return six weeks of days starting from a Sunday', () => {
    // March 2024 starts on a Friday
    const days = getCalendarDays(new Date('2024-03-01T00:00:00Z'));

    expect(days).toHaveLength(DAY_GRID_SIZE);
    expect(days[0].getUTCDay()).toBe(0);
    expect(toDateString(days[0])).toBe('2024-02-25');
    expect(toDateString(days[5])).toBe('2024-03-01');
  });

  it('should produce consecutive days', () => {
    const days = getCalendarDays(new Date('2024-01-01T00:00:00Z'));

    days.slice(1).forEach((day, index) => {
      expect(day.getTime() - days[index].getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  it('should start on the first day itself when the month begins on a Sunday', () => {
    // October 1, 2023 was a Sunday
    const days = getCalendarDays(new Date('2023-10-01T00:00:00Z'));

    expect(toDateString(days[0])).toBe('2023-10-01');
  });

  it('should not modify the given date', () => {
    const firstDay = new Date('2024-03-01T00:00:00Z');

    getCalendarDays(firstDay);
    expect(firstDay.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });
});

describe('time zones', () => {
  const originalTZ = process.env.TZ;

  afterEach(() => {
    // Assigning `undefined` to an environment variable stores the string `'undefined'`
    if (originalTZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTZ;
    }
  });

  it.each(['Asia/Tokyo', 'America/Los_Angeles', 'Pacific/Kiritimati', 'UTC'])(
    'should lay out the same grid in %s',
    (timeZone) => {
      process.env.TZ = timeZone;

      let firstDay = getFirstDayOfMonth(new Date('2026-09-15'));

      expect(toDateString(firstDay)).toBe('2026-09-01');
      expect(toDateString(getCalendarDays(firstDay)[0])).toBe('2026-08-30');

      firstDay = addMonths(firstDay, 1);
      expect(toDateString(firstDay)).toBe('2026-10-01');
      expect(toDateString(getCalendarDays(firstDay)[0])).toBe('2026-09-27');
    },
  );
});

describe('toDateString', () => {
  it('should format the date as YYYY-MM-DD in UTC', () => {
    expect(toDateString(new Date('2024-03-05T00:00:00Z'))).toBe('2024-03-05');
    expect(toDateString(new Date('2024-12-31T23:59:59Z'))).toBe('2024-12-31');
  });
});

describe('getToday', () => {
  it('should return the local calendar day as UTC midnight', () => {
    // Early morning and late evening, local time: the UTC date may differ, the result must not
    expect(toDateString(getToday(new Date(2024, 2, 5, 1)))).toBe('2024-03-05');
    expect(toDateString(getToday(new Date(2024, 2, 5, 23)))).toBe('2024-03-05');
  });

  it('should default to the current date', () => {
    const now = new Date();

    expect(getToday().getUTCDate()).toBe(now.getDate());
  });
});
