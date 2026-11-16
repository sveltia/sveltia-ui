import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPointerDrag } from './pointer-drag.js';

/**
 * Make a pointer event. The `PointerEvent` constructor may lack some properties in the test
 * environment, so they are set on a plain event.
 * @param {string} type Event type.
 * @param {Record<string, any>} [props] Event properties.
 * @returns {PointerEvent} Event.
 */
const createEvent = (type, props = {}) =>
  /** @type {PointerEvent} */ (
    Object.assign(new Event(type, { bubbles: true }), { pointerId: 1, pointerType: '', ...props })
  );

/**
 * Make a stand-in element that records the pointer capture.
 * @returns {HTMLElement & { captured: Set<number> }} Element.
 */
const createElement = () => {
  /** @type {Set<number>} */
  const captured = new Set();

  return /** @type {any} */ ({
    captured,
    setPointerCapture: vi.fn((id) => captured.add(id)),
    releasePointerCapture: vi.fn((id) => captured.delete(id)),
    hasPointerCapture: vi.fn((id) => captured.has(id)),
  });
};

/** @type {(() => void) | undefined} */
let stop;

afterEach(() => {
  stop?.();
  stop = undefined;
});

describe('startPointerDrag', () => {
  it('captures the pointer and follows its moves until it’s released', () => {
    const element = createElement();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    stop = startPointerDrag(element, createEvent('pointerdown'), { onMove, onEnd });
    expect(element.captured.has(1)).toBe(true);

    const move = createEvent('pointermove');

    document.dispatchEvent(move);
    expect(onMove).toHaveBeenCalledWith(move);

    const up = createEvent('pointerup');

    document.dispatchEvent(up);
    expect(onEnd).toHaveBeenCalledExactlyOnceWith(up);
    expect(element.captured.has(1)).toBe(false);

    // Once ended, the pointer is no longer followed
    document.dispatchEvent(createEvent('pointermove'));
    document.dispatchEvent(createEvent('pointerup'));
    expect(onMove).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('ends the drag on `pointercancel`', () => {
    const onEnd = vi.fn();

    stop = startPointerDrag(createElement(), createEvent('pointerdown'), { onEnd });
    document.dispatchEvent(createEvent('pointercancel'));
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('ignores the events of other pointers', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    stop = startPointerDrag(createElement(), createEvent('pointerdown'), { onMove, onEnd });
    document.dispatchEvent(createEvent('pointermove', { pointerId: 2 }));
    document.dispatchEvent(createEvent('pointerup', { pointerId: 2 }));
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('ends a mouse drag once the primary button is no longer held down', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const props = { pointerType: 'mouse' };

    stop = startPointerDrag(createElement(), createEvent('pointerdown', props), { onMove, onEnd });
    document.dispatchEvent(createEvent('pointermove', { ...props, buttons: 1 }));
    // Only the secondary button is held down
    document.dispatchEvent(createEvent('pointermove', { ...props, buttons: 2 }));
    expect(onMove).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd.mock.calls[0][0].type).toBe('pointermove');
  });

  it('carries on with a pen or touch moved without buttons', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    stop = startPointerDrag(createElement(), createEvent('pointerdown'), { onMove, onEnd });
    document.dispatchEvent(createEvent('pointermove', { pointerType: 'pen', buttons: 0 }));
    expect(onMove).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('stops following the pointer without calling `onEnd` when stopped', () => {
    const element = createElement();
    const onMove = vi.fn();
    const onEnd = vi.fn();

    startPointerDrag(element, createEvent('pointerdown'), { onMove, onEnd })();
    expect(element.captured.has(1)).toBe(false);
    document.dispatchEvent(createEvent('pointermove'));
    document.dispatchEvent(createEvent('pointerup'));
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('works without handlers', () => {
    stop = startPointerDrag(createElement(), createEvent('pointerdown'), {});
    expect(() => {
      document.dispatchEvent(createEvent('pointermove'));
      document.dispatchEvent(createEvent('pointerup'));
    }).not.toThrow();
  });
});
