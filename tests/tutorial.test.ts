import { describe, expect, it } from 'vitest';
import { FONT_SIZES, TUTORIAL } from '@/config';
import { TUTORIAL_CARDS } from '@/data/tutorial';
import { TUTORIAL_STEPS, TutorialSteps } from '@/logic/tutorial';

describe('the interactive tutorial', () => {
  it('starts on lining up', () => {
    expect(new TutorialSteps().step).toBe('lineUp');
  });

  it('moves to holding once lined up, then to the score once the pose locks', () => {
    const steps = new TutorialSteps();
    expect(steps.update(false, false, 0)).toBeNull();
    expect(steps.update(true, false, 0)).toBe('hold');
    expect(steps.update(true, false, 1)).toBeNull();
    expect(steps.update(true, true, 3)).toBe('score');
    expect(steps.step).toBe('score');
  });

  it('never goes back to a step already done', () => {
    const steps = new TutorialSteps();
    steps.update(true, false, 0);
    expect(steps.update(false, false, 0)).toBeNull();
    expect(steps.step).toBe('hold');
    steps.update(true, true, 3);
    expect(steps.update(true, false, 0)).toBeNull();
    expect(steps.step).toBe('score');
  });

  it('holds the wall still through lining up and until the first letter is held', () => {
    const steps = new TutorialSteps();
    expect(steps.wallWaits).toBe(true);
    steps.update(true, false, 0);
    expect(steps.step).toBe('hold');
    expect(steps.wallWaits).toBe(true);
    steps.update(true, false, 1);
    expect(steps.wallWaits).toBe(false);
  });

  it('keeps the wall coming once it has started, even if every letter slips', () => {
    const steps = new TutorialSteps();
    steps.update(true, false, 1);
    steps.update(true, false, 0);
    expect(steps.wallWaits).toBe(false);
  });

  it('reports each step once, even if two are done at once', () => {
    const steps = new TutorialSteps();
    expect(steps.update(true, true, 3)).toBe('score');
    expect(steps.update(true, true, 3)).toBeNull();
  });

  // Plex Mono's letters are 0.6 of its size wide; one line keeps the card
  // above the wall and step 3's Start above the figure.
  it.each(TUTORIAL_STEPS)("fits the %s card's sentence on one line", (step) => {
    const room = TUTORIAL.card.width - 2 * TUTORIAL.card.padX;
    expect(0.6 * FONT_SIZES.small * TUTORIAL_CARDS[step].text.length).toBeLessThanOrEqual(room);
  });
});
