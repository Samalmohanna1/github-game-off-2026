import Phaser from 'phaser';
import { toVectors } from '@/objects/vectors';

export interface SlashSpec {
  readonly x: number; // the top-left corner
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly lean: number; // how far the foot sits left of the top, px; negative leans the other way
  readonly top: number; // color at the top, fading to `foot` at the foot
  readonly foot: number;
  readonly slices: number;
}

// One stroke of the "//" motif shared by the HUD cards and the bar (M10b,
// after the mockup): a slanted parallelogram, its color fading from top to
// foot in horizontal slices.
export function fillSlash(g: Phaser.GameObjects.Graphics, s: SlashSpec): void {
  const top = Phaser.Display.Color.IntegerToColor(s.top);
  const foot = Phaser.Display.Color.IntegerToColor(s.foot);
  for (let i = 0; i < s.slices; i++) {
    const [t0, t1] = [i / s.slices, (i + 1) / s.slices];
    const mix = Phaser.Display.Color.Interpolate.ColorWithColor(top, foot, Math.max(1, s.slices - 1), i);
    g.fillStyle(Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b));
    const at = (t: number, dx: number) => ({ x: s.x - s.lean * t + dx, y: s.y + s.height * t });
    g.fillPoints(toVectors([at(t0, 0), at(t0, s.width), at(t1, s.width), at(t1, 0)]), true);
  }
}
