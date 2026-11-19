import { describe, expect, it } from 'vitest';
import { READY_COUNT } from '@/config';
import { READY_LABELS, readyCountMs, readyStep } from '@/logic/ready-count';

describe('the count into the first wall', () => {
  it('reads READY?, then 3, 2, 1', () => {
    expect(READY_LABELS).toEqual(['READY?', '3', '2', '1']);
  });

  it('holds READY? for its own time, then each number for one step', () => {
    expect(readyStep(0)).toBe(0);
    expect(readyStep(READY_COUNT.readyMs - 1)).toBe(0);
    expect(readyStep(READY_COUNT.readyMs)).toBe(1);
    expect(readyStep(READY_COUNT.readyMs + READY_COUNT.stepMs - 1)).toBe(1);
    expect(readyStep(READY_COUNT.readyMs + READY_COUNT.stepMs)).toBe(2);
    expect(readyStep(READY_COUNT.readyMs + 2 * READY_COUNT.stepMs)).toBe(3);
  });

  it('is over once 1 has had its step, and stays over', () => {
    expect(readyCountMs()).toBe(READY_COUNT.readyMs + 3 * READY_COUNT.stepMs);
    expect(readyStep(readyCountMs() - 1)).toBe(READY_LABELS.length - 1);
    expect(readyStep(readyCountMs())).toBe(READY_LABELS.length);
    expect(readyStep(readyCountMs() * 10)).toBe(READY_LABELS.length);
  });
});
