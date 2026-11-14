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

// Where a one-line text's letters start and end, in px from its top: its
// baseline (where Phaser draws it) less and plus the letters' own measured
// reach, not the font's line box.
function glyphSpan(text: Phaser.GameObjects.Text): readonly [number, number] {
  probe ??= document.createElement('canvas').getContext('2d');
  if (probe === null) return [0, text.height];
  const baseline = (text.padding.top ?? 0) + text.style.strokeThickness / 2 + text.getTextMetrics().ascent;
  probe.font = `${text.style.fontStyle} ${text.style.fontSize} ${text.style.fontFamily}`.trim();
  const letters = probe.measureText(text.text);
  return [baseline - letters.actualBoundingBoxAscent, baseline + letters.actualBoundingBoxDescent];
}

// Centers a one-line text's letters on its y. Anton's line box leaves more
// room above its capitals than below, so centering the box set them low on
// cards and buttons (M11 review).
export function centerGlyphs(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  const [top, bottom] = glyphSpan(text);
  return text.setOrigin(text.originX, (top + bottom) / 2 / text.height);
}

// How tall a one-line text's letters stand, px.
export function glyphHeight(text: Phaser.GameObjects.Text): number {
  const [top, bottom] = glyphSpan(text);
  return bottom - top;
}
