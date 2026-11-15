import type Phaser from 'phaser';
import { COLORS, DISPLAY_FONT_FAMILY, FONT_FAMILY, FONT_ROLES, FONT_SIZES, TEXT_COLORS, TEXT_OUTLINE } from '@/config';

type Size = keyof typeof FONT_SIZES;
type Color = keyof typeof TEXT_COLORS;

export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

// The size picks the family (FONT_ROLES): display sizes set in Anton, which has
// a single weight, so `bold` only applies to the mono sizes.
export function textStyle(
  size: Size,
  color: Color = 'ink',
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  const display = FONT_ROLES[size] === 'display';
  return {
    fontFamily: display ? DISPLAY_FONT_FAMILY : FONT_FAMILY,
    fontSize: `${FONT_SIZES[size]}px`,
    fontStyle: bold && !display ? 'bold' : 'normal',
    color: TEXT_COLORS[color],
    align: 'center',
  };
}

// Bright text inside a thick dark outline, for text drawn over the moving
// scene with nothing behind it: the outline is all that touches the letters,
// so they read over anything.
export function outlinedStyle(size: Size, color: Color, bold = false): Phaser.Types.GameObjects.Text.TextStyle {
  return { ...textStyle(size, color, bold), stroke: toCss(COLORS.textOutline), strokeThickness: TEXT_OUTLINE[size] };
}

let probe: CanvasRenderingContext2D | null = null;

interface GlyphBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

// Where a one-line text's letters start and end, in px from its top-left:
// where Phaser draws it (its baseline, and its left edge inside the padding)
// less and plus the letters' own measured reach, not the font's line box or
// the letters' side bearings. `sample` measures other letters in its place.
function glyphBox(text: Phaser.GameObjects.Text, sample = text.text): GlyphBox {
  probe ??= document.createElement('canvas').getContext('2d');
  if (probe === null) return { left: 0, right: text.width, top: 0, bottom: text.height };
  const inset = text.style.strokeThickness / 2;
  const baseline = (text.padding.top ?? 0) + inset + text.getTextMetrics().ascent;
  const start = (text.padding.left ?? 0) + inset;
  probe.font = `${text.style.fontStyle} ${text.style.fontSize} ${text.style.fontFamily}`.trim();
  const letters = probe.measureText(sample);
  return {
    left: start - letters.actualBoundingBoxLeft,
    right: start + letters.actualBoundingBoxRight,
    top: baseline - letters.actualBoundingBoxAscent,
    bottom: baseline + letters.actualBoundingBoxDescent,
  };
}

// Centers a one-line text's letters on its y. Anton's line box leaves more
// room above its capitals than below, so centering the box set them low on
// cards and buttons (M11 review). A number's commas hang below its digits,
// so it is centered on its digits alone, wherever its commas fall.
export function centerGlyphs(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  const { top, bottom } = glyphBox(text, text.text.replace(/(\d),(?=\d)/g, '$1'));
  return text.setOrigin(text.originX, (top + bottom) / 2 / text.height);
}

// Puts a one-line text's letters' own left or right edge on its x, so lines
// of different letters stack flush (the game-over card's rows, M11 review 2).
export function alignGlyphs(text: Phaser.GameObjects.Text, side: 'left' | 'right'): Phaser.GameObjects.Text {
  const box = glyphBox(text);
  return text.setOrigin(box[side] / text.width, text.originY);
}

// How wide a one-line text's letters reach, px.
export function glyphWidth(text: Phaser.GameObjects.Text): number {
  const { left, right } = glyphBox(text);
  return right - left;
}
