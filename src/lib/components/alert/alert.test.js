import { describe, expect, it } from 'vitest';
import { getAlertAriaLive, getAlertRole } from './alert.js';

describe('getAlertRole', () => {
  it('should return `alert` for errors and warnings', () => {
    expect(getAlertRole('error')).toBe('alert');
    expect(getAlertRole('warning')).toBe('alert');
  });

  it('should return `status` for information and success', () => {
    expect(getAlertRole('info')).toBe('status');
    expect(getAlertRole('success')).toBe('status');
  });
});

describe('getAlertAriaLive', () => {
  it('should default to the politeness for the role', () => {
    expect(getAlertAriaLive('alert')).toBe('assertive');
    expect(getAlertAriaLive('status')).toBe('polite');
  });

  it('should prefer an explicit politeness', () => {
    expect(getAlertAriaLive('alert', 'off')).toBe('off');
    expect(getAlertAriaLive('status', 'assertive')).toBe('assertive');
  });
});
