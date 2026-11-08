import type Phaser from 'phaser';
import { DISPLAY_FONT_FAMILY, FONT_FAMILY, FONT_ROLES, FONT_SIZES, TEXT_COLORS } from '@/config';

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
