// The interactive tutorial's steps (the Play scene's tutorial mode): line up
// under the hole, hold every letter, then see the score. Each step's card
// shows until the player has done it.
export const TUTORIAL_STEPS = ['lineUp', 'hold', 'score'] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

export class TutorialSteps {
  private current: TutorialStep = 'lineUp';

  get step(): TutorialStep {
    return this.current;
  }

  // The wall waits at its start until the player has lined up, so step 1 is
  // learned with no clock; from step 2 it comes at its real speed. A wrong
  // key doesn't push it on either.
  get wallWaits(): boolean {
    return this.current === 'lineUp';
  }

  // Moves on as the player does each step: lined up is step 2, the pose
  // locked is step 3. Steps only go forward, so a step once done stays done.
  // Returns the new step when it changes, else null.
  update(aligned: boolean, locked: boolean): TutorialStep | null {
    const reached: TutorialStep = locked ? 'score' : aligned ? 'hold' : 'lineUp';
    if (TUTORIAL_STEPS.indexOf(reached) <= TUTORIAL_STEPS.indexOf(this.current)) return null;
    this.current = reached;
    return reached;
  }
}
