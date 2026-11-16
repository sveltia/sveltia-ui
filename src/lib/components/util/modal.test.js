import { afterEach, describe, expect, it } from 'vitest';
import {
  forgetModalDialog,
  getLongestTime,
  getTransitionTimeout,
  openModalDialogs,
  rememberModalDialog,
} from './modal.js';

describe('getLongestTime', () => {
  it('should convert a single time to milliseconds', () => {
    expect(getLongestTime('0.4s')).toBe(400);
    expect(getLongestTime('2s')).toBe(2000);
  });

  it('should pick the longest of a list', () => {
    expect(getLongestTime('0.4s, 0.15s')).toBe(400);
    expect(getLongestTime('0.1s,1s,0.5s')).toBe(1000);
  });

  it('should return zero for an empty or invalid list', () => {
    expect(getLongestTime('')).toBe(0);
    expect(getLongestTime('0s')).toBe(0);
    expect(getLongestTime('none')).toBe(0);
  });
});

describe('getTransitionTimeout', () => {
  it('should add the longest duration and delay with a margin', () => {
    expect(
      getTransitionTimeout({ transitionDuration: '0.4s, 0.1s', transitionDelay: '0.2s' }),
    ).toBe(700);
  });

  it('should fall back to the margin alone without a transition', () => {
    expect(getTransitionTimeout({ transitionDuration: '0s', transitionDelay: '0s' })).toBe(100);
  });
});

describe('openModalDialogs', () => {
  afterEach(() => {
    openModalDialogs.length = 0;
  });

  it('remembers the dialogs in the order they were opened, the topmost last', () => {
    const first = document.createElement('dialog');
    const second = document.createElement('dialog');

    rememberModalDialog(first);
    rememberModalDialog(second);
    expect(openModalDialogs).toEqual([first, second]);
    // A dialog opened again goes back on top
    rememberModalDialog(first);
    expect(openModalDialogs).toEqual([second, first]);
  });

  it('forgets a dialog, and ignores one it doesn’t know', () => {
    const first = document.createElement('dialog');
    const second = document.createElement('dialog');

    rememberModalDialog(first);
    forgetModalDialog(second);
    forgetModalDialog(undefined);
    expect(openModalDialogs).toEqual([first]);
    forgetModalDialog(first);
    expect(openModalDialogs).toEqual([]);
  });
});
