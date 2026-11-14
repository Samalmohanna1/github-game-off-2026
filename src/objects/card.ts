import Phaser from 'phaser';
import { CARD, COLORS, SLASH } from '@/config';
import type { Point } from '@/logic/perspective';
import { fillSlash } from '@/objects/slash';
import { toVectors } from '@/objects/vectors';

// Which sides slant inward toward the card's foot. Each slanted side gets a
// fold inside it and slashes beside it; a straight side has its corners cut.
export type CardSlant = 'left' | 'right' | 'both';

export interface CardSpec {
  readonly x: number; // the card's box, its top edge; the slashes stand outside it
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly slant: CardSlant;
}

// How far a card's slanted side runs inward over its height.
export function cardSlant(height: number): number {
  return (CARD.slant * height) / CARD.height;
}

// A card after the mockup's HUD (M10b review 2): cream, its straight side's
// corners cut, a slanted side with a sage fold in its foot corner and lime
// slashes beside it, the first fading to deep green toward its foot. The HUD,
// the title's logo, the pause card and the game-over cards (M11). Everything
// scales with the card's height, so every slant keeps one angle.
export function drawCard(g: Phaser.GameObjects.Graphics, c: CardSpec): void {
  const k = c.height / CARD.height;
  const [cut, slant, fold] = [CARD.cut * k, cardSlant(c.height), CARD.foldWidth * k];
  const { x, y, width: w, height: h } = c;
  const [left, right] = [c.slant !== 'right', c.slant !== 'left'];

  g.fillStyle(COLORS.card);
  g.fillPoints(
    toVectors([
      ...(left ? [{ x, y }] : [{ x: x + cut, y }]),
      ...(right ? [{ x: x + w, y }] : [{ x: x + w - cut, y }, { x: x + w, y: y + cut }]),
      ...(right ? [{ x: x + w - slant, y: y + h }] : [{ x: x + w, y: y + h - cut }, { x: x + w - cut, y: y + h }]),
      ...(left ? [{ x: x + slant, y: y + h }] : [{ x: x + cut, y: y + h }, { x, y: y + h - cut }, { x, y: y + cut }]),
    ]),
    true,
  );

  // Each slanted side is drawn as the right one, mirrored about the card's
  // middle for the left.
  const edge = (at: number) => x + w - (slant * (at - y)) / h;
  const foldTop = y + h * CARD.foldFrom;
  const slashGap = CARD.slashGap * k;
  const [thick, thin, gap] = [SLASH.width * k, (SLASH.width * k) / 3, SLASH.gap * k];
  for (const mirrored of [...(right ? [false] : []), ...(left ? [true] : [])]) {
    const side = (p: Point): Point => (mirrored ? { x: 2 * x + w - p.x, y: p.y } : p);
    g.fillStyle(COLORS.cardFold, CARD.foldAlpha);
    g.fillPoints(
      toVectors(
        [
          { x: edge(foldTop) - fold, y: foldTop },
          { x: edge(foldTop), y: foldTop },
          { x: edge(y + h), y: y + h },
          { x: edge(y + h) - fold, y: y + h },
        ].map(side),
      ),
      true,
    );
    // A slash's top-left corner, from where its top edge starts on the right.
    const slashX = (from: number, width: number) => (mirrored ? 2 * x + w - from - width : from);
    const slash = { y, height: h, lean: mirrored ? -slant : slant, slices: CARD.slashSlices };
    const first = x + w + slashGap;
    fillSlash(g, { ...slash, x: slashX(first, thick), width: thick, top: COLORS.cardSlash, foot: COLORS.cardSlashEnd });
    const second = first + thick + gap;
    fillSlash(g, { ...slash, x: slashX(second, thin), width: thin, top: COLORS.cardSlashEnd, foot: COLORS.void });
  }
}

// How far a card's slashes reach out past its box on a slanted side.
export function cardSlashReach(height: number): number {
  const k = height / CARD.height;
  return (CARD.slashGap + SLASH.width + SLASH.gap + SLASH.width / 3) * k;
}
