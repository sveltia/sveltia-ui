import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateBefore, activateLater } from './widget.js';

describe('activateBefore', () => {
  it('activates the widget before handing the event on', () => {
    /** @type {string[]} */
    const calls = [];

    const widget = {
      /** Record the activation. */
      activate: () => {
        calls.push('activate');
      },
    };

    const event = new Event('click');

    const listener = activateBefore(widget, (/** @type {Event} */ received) => {
      calls.push('handle');
      expect(received).toBe(event);
    });

    listener(event);
    expect(calls).toEqual(['activate', 'handle']);
  });
});

describe('activateLater', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('activates the widget after a delay', async () => {
    const widget = { activate: vi.fn() };

    activateLater(widget, () => false);
    expect(widget.activate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(widget.activate).toHaveBeenCalledOnce();
  });

  it('leaves a widget destroyed in the meantime alone', async () => {
    const widget = { activate: vi.fn() };
    let destroyed = false;

    activateLater(widget, () => destroyed);
    destroyed = true;
    await vi.advanceTimersByTimeAsync(100);
    expect(widget.activate).not.toHaveBeenCalled();
  });
});
