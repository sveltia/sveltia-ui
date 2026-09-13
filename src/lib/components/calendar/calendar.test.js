import { describe, expect, it } from 'vitest';
import {
  addMonths,
  DAY_GRID_SIZE,
  getCalendarDays,
  getFirstDayOfMonth,
  isSameDay,
  MONTH_NAMES,
  toDateString,
} from './calendar.js';

describe('MONTH_NAMES', () => {
  it('should list the twelve short month names in English', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Jan');
    expect(MONTH_NAMES[11]).toBe('Dec');
  });
});

describe('getFirstDayOfMonth', () => {
  it('should return the first day of the month in local time', () => {
    const first = getFirstDayOfMonth(new Date('2024-03-15T12:00:00Z'));

    expect(first.getFullYear()).toBe(2024);
    expect(first.getMonth()).toBe(2);
    expect(first.getDate()).toBe(1);
    expect(first.getHours()).toBe(0);
  });

  it('should use the UTC month, so a date-only value lands in the right month', () => {
    // Parsed as UTC midnight, which is still the previous day in time zones behind UTC
    const first = getFirstDayOfMonth(new Date('2024-03-01'));

    expect(first.getMonth()).toBe(2);
  });
});

describe('addMonths', () => {
  it('should move to the first day of another month', () => {
    const march = new Date(2024, 2, 1);
    const february = addMonths(march, -1);
    const may = addMonths(march, 2);

    expect(february.getUTCMonth()).toBe(1);
    expect(february.getUTCDate()).toBe(march.getUTCDate());
    expect(may.getUTCMonth()).toBe(4);
  });

  it('should cross year boundaries', () => {
    expect(addMonths(new Date(2024, 0, 1), -1).getUTCFullYear()).toBe(2023);
    expect(addMonths(new Date(2024, 11, 1), 1).getUTCFullYear()).toBe(2025);
  });

  it('should not modify the given date', () => {
    const march = new Date(2024, 2, 1);

    addMonths(march, 1);
    expect(march.getMonth()).toBe(2);
  });
});

describe('getCalendarDays', () => {
  it('should return six weeks of days starting from a Sunday', () => {
    const days = getCalendarDays(new Date(2024, 2, 1)); // March 2024 starts on a Friday

    expect(days).toHaveLength(DAY_GRID_SIZE);
    expect(days[0].getDay()).toBe(0);
    expect(days[0].getDate()).toBe(25); // February 25
    expect(days[5].getDate()).toBe(1);
    expect(days[5].getMonth()).toBe(2);
  });

  it('should produce consecutive days', () => {
    const days = getCalendarDays(new Date(2024, 0, 1));

    days.slice(1).forEach((day, index) => {
      expect(day.getTime() - days[index].getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  it('should start on the first day itself when the month begins on a Sunday', () => {
    const days = getCalendarDays(new Date(2023, 9, 1)); // October 1, 2023 was a Sunday

    expect(days[0].getDate()).toBe(1);
    expect(days[0].getMonth()).toBe(9);
  });

  it('should not modify the given date', () => {
    const firstDay = new Date(2024, 2, 1);

    getCalendarDays(firstDay);
    expect(firstDay.getDate()).toBe(1);
  });
});

describe('toDateString', () => {
  it('should format the date as YYYY-MM-DD in UTC', () => {
    expect(toDateString(new Date('2024-03-05T00:00:00Z'))).toBe('2024-03-05');
    expect(toDateString(new Date('2024-12-31T23:59:59Z'))).toBe('2024-12-31');
  });
});

describe('isSameDay', () => {
  it('should compare the local calendar day only', () => {
    expect(isSameDay(new Date(2024, 2, 5, 1), new Date(2024, 2, 5, 23))).toBe(true);
    expect(isSameDay(new Date(2024, 2, 5), new Date(2024, 2, 6))).toBe(false);
    expect(isSameDay(new Date(2024, 2, 5), new Date(2024, 3, 5))).toBe(false);
    expect(isSameDay(new Date(2024, 2, 5), new Date(2023, 2, 5))).toBe(false);
  });
});
