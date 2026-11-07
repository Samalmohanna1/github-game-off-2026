import type Phaser from 'phaser';
import { FONT_FAMILY, FONT_SIZES, TEXT_COLORS } from '@/config';

type Size = keyof typeof FONT_SIZES;
type Color = keyof typeof TEXT_COLORS;

export function textStyle(
  size: Size,
  color: Color = 'ink',
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${FONT_SIZES[size]}px`,
    fontStyle: bold ? 'bold' : 'normal',
    color: TEXT_COLORS[color],
    align: 'center',
  };
}
