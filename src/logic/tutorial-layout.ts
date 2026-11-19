import { GAME_WIDTH, STAGE_BOTTOM_Y, TUTORIAL } from '@/config';
import type { TutorialStep } from '@/logic/tutorial';

export type Side = -1 | 1;

// Where a step's card goes: its left edge and width, and either its top
// (`from: 'top'`) or its foot (`from: 'bottom'`) on y, since its height
// depends on its copy.
export interface CardPlace {
  readonly left: number;
  readonly width: number;
  readonly y: number;
  readonly from: 'top' | 'bottom';
}

// Each step's card sits by what it is about (a review asked for this):
// 1, line up, beside the runway's far end, where the wall waits, on the side
// of the hole the figure is heading for; 2, hold on, just above the letter
// bar, on the side away from the figure, so it never covers the pose; 3, the
// score, at the top between the HUD's cards. `holeSide` and `figureSide`
// say which half of the stage the hole and the figure are in.
export function tutorialCardPlace(step: TutorialStep, holeSide: Side, figureSide: Side): CardPlace {
  const { card, marginX } = TUTORIAL;
  const atSide = (side: Side, width: number) => (side < 0 ? marginX : GAME_WIDTH - marginX - width);
  if (step === 'lineUp') return { left: atSide(holeSide, card.sideWidth), width: card.sideWidth, y: TUTORIAL.lineUpTop, from: 'top' };
  if (step === 'hold') {
    const away: Side = figureSide < 0 ? 1 : -1;
    return { left: atSide(away, card.width), width: card.width, y: STAGE_BOTTOM_Y - TUTORIAL.holdGap, from: 'bottom' };
  }
  return { left: (GAME_WIDTH - card.width) / 2, width: card.width, y: TUTORIAL.scoreTop, from: 'top' };
}
