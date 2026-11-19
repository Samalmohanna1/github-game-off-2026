import { describe, expect, it } from 'vitest';
import { TutorialSteps } from '@/logic/tutorial';

describe('the interactive tutorial', () => {
  it('starts on lining up', () => {
    expect(new TutorialSteps().step).toBe('lineUp');
  });

  it('moves to holding once lined up, then to the score once the pose locks', () => {
    const steps = new TutorialSteps();
    expect(steps.update(false, false)).toBeNull();
    expect(steps.update(true, false)).toBe('hold');
    expect(steps.update(true, false)).toBeNull();
    expect(steps.update(true, true)).toBe('score');
    expect(steps.step).toBe('score');
  });

  it('never goes back to a step already done', () => {
    const steps = new TutorialSteps();
    steps.update(true, false);
    expect(steps.update(false, false)).toBeNull();
    expect(steps.step).toBe('hold');
    steps.update(true, true);
    expect(steps.update(true, false)).toBeNull();
    expect(steps.step).toBe('score');
  });

  it('holds the wall still until the player lines up, then lets it come', () => {
    const steps = new TutorialSteps();
    expect(steps.wallWaits).toBe(true);
    steps.update(true, false);
    expect(steps.wallWaits).toBe(false);
    steps.update(true, true);
    expect(steps.wallWaits).toBe(false);
  });

  it('reports each step once, even if two are done at once', () => {
    const steps = new TutorialSteps();
    expect(steps.update(true, true)).toBe('score');
    expect(steps.update(true, true)).toBeNull();
  });
});
