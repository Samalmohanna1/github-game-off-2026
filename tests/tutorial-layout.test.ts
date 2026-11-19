import { describe, expect, it } from 'vitest';
import * as C from '@/config';
import { TUTORIAL_CARDS } from '@/data/tutorial';
import { CENTER_LANE, laneCenterX } from '@/logic/lanes';
import { FLOOR_HALF_WIDTH, VANISHING_POINT as VP, scaleAtFloorY } from '@/logic/perspective';
import type { TutorialStep } from '@/logic/tutorial';
import { tutorialCardPlace, type Side } from '@/logic/tutorial-layout';

const T = C.TUTORIAL;
const SIDES: readonly Side[] = [-1, 1];

interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// Plex Mono's letters are 0.6 of its size wide, so a line holds a fixed
// number of them; words wrap greedily, as Phaser's word wrap does.
function lineCount(text: string, cardWidth: number): number {
  const perLine = Math.floor((cardWidth - 2 * T.card.padX) / (0.6 * C.FONT_SIZES.small));
  let count = 1;
  let used = 0;
  for (const word of text.split(' ')) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need > perLine && used > 0) {
      count++;
      used = word.length;
    } else used = need;
  }
  return count;
}

function cardBox(step: TutorialStep, holeSide: Side, figureSide: Side): Box {
  const place = tutorialCardPlace(step, holeSide, figureSide);
  const height = T.card.textY + lineCount(TUTORIAL_CARDS[step].text, place.width) * T.card.lineHeight + T.card.padBottom;
  const top = place.from === 'top' ? place.y : place.y - height;
  return { left: place.left, right: place.left + place.width, top, bottom: top + height };
}

// The wall where it waits through step 1: at its starting depth, drawn
// around the vanishing point.
const s0 = C.WALL_START_SCALE;
const waitingWall: Box = {
  left: VP.x - FLOOR_HALF_WIDTH * s0,
  right: VP.x + FLOOR_HALF_WIDTH * s0,
  top: VP.y + (C.FIGURE_FLOOR_Y - C.WALL_HEIGHT - VP.y) * s0,
  bottom: VP.y + (C.FIGURE_FLOOR_Y - VP.y) * s0,
};

const figureIn = (lane: number): Box => ({
  left: laneCenterX(lane) - C.FIGURE_WIDTH / 2,
  right: laneCenterX(lane) + C.FIGURE_WIDTH / 2,
  top: C.FIGURE_FLOOR_Y - C.FIGURE_HEIGHT,
  bottom: C.FIGURE_FLOOR_Y,
});

const onScreen = (box: Box) => box.left >= 0 && box.right <= C.GAME_WIDTH && box.top >= 0 && box.bottom <= C.GAME_HEIGHT;

describe('where the tutorial cards go', () => {
  it.each(SIDES)("puts step 1 beside the runway on the hole's side (%i), clear of the waiting wall", (side) => {
    const box = cardBox('lineUp', side, 1);
    expect(onScreen(box)).toBe(true);
    expect(side < 0 ? box.right < VP.x : box.left > VP.x).toBe(true);
    expect(overlaps(box, waitingWall)).toBe(false);
    // The runway widens toward the camera, so the card's foot, on its inner
    // side, is where it comes nearest.
    const inner = side < 0 ? box.right : box.left;
    expect(Math.abs(inner - VP.x)).toBeGreaterThan(FLOOR_HALF_WIDTH * scaleAtFloorY(box.bottom));
  });

  it('keeps step 1, on the right, under ENTER TO SKIP', () => {
    expect(T.skipY + C.KEY_CAP.height / 2).toBeLessThan(cardBox('lineUp', 1, 1).top);
  });

  it.each(SIDES)('puts step 2 just above the letter bar, clear of the figure in any lane on side %i', (figureSide) => {
    const box = cardBox('hold', 1, figureSide);
    expect(onScreen(box)).toBe(true);
    expect(box.bottom).toBeLessThanOrEqual(C.STAGE_BOTTOM_Y);
    for (let lane = 0; lane < C.LANE_COUNT; lane++) {
      if (Math.sign(lane - CENTER_LANE) === figureSide) expect(overlaps(box, figureIn(lane)), `lane ${lane}`).toBe(false);
    }
  });

  describe('step 3, at the top', () => {
    const box = cardBox('score', 1, 1);
    const B = C.PROMPT_BUTTON;
    const buttonMiddle = box.bottom + B.gapAbove + B.edgeWidth + B.height / 2;
    // Over the cream runway the hint sits on a small dark card (HINT_CARD).
    const hintCardFoot = buttonMiddle + B.hintBelow + C.HINT_CARD.height / 2 + C.DARK_CARD.edgeWidth;

    it("sits centered between the HUD's cards, slashes and all", () => {
      const hudReach = C.HUD.marginX + C.HUD.minWidth + 2 * C.SLASH.width + C.SLASH.gap + C.SLASH.lean;
      expect(box.top).toBe(T.scoreTop);
      expect(box.left).toBeCloseTo(C.GAME_WIDTH - box.right);
      expect(box.left).toBeGreaterThan(hudReach);
    });

    it('sets its Start button and the hint on its card under it, above the figure', () => {
      expect(hintCardFoot).toBeLessThan(C.FIGURE_FLOOR_Y - C.FIGURE_HEIGHT);
    });

    it('keeps the Caps Lock warning between the card and its Start button', () => {
      const half = C.FONT_SIZES.small / 2;
      expect(T.capsWarningY - half).toBeGreaterThan(box.bottom);
      expect(T.capsWarningY + half).toBeLessThan(box.bottom + B.gapAbove);
    });
  });
});
