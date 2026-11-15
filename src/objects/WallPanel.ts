import Phaser from 'phaser';
import { COLORS, WALL_DISPLAY } from '@/config';
import { WALL_PANEL, coverFit, gridLines, type WallLayout } from '@/logic/wall-shape';
import { toCss } from '@/scenes/text-styles';

const TEXTURE = 'wall-panel';

// The wall's face (M10b review 4): one canvas texture the size of the wall at
// full scale, painted as a dark glass display panel. Its cell grid lies on the
// hole's, so it is repainted whenever the hole moves (a new wall, a Shift
// Wall's slide). The wall and the completion both show it through
// ImagePieces, so the hole is cut out of it and the completion fills it back
// in.
export class WallPanel {
  private readonly texture: Phaser.Textures.CanvasTexture | null;

  constructor(scene: Phaser.Scene) {
    const existing = scene.textures.exists(TEXTURE) ? scene.textures.get(TEXTURE) : null;
    this.texture =
      existing instanceof Phaser.Textures.CanvasTexture
        ? existing
        : scene.textures.createCanvas(TEXTURE, Math.ceil(WALL_PANEL.width), Math.ceil(WALL_PANEL.height));
  }

  // The texture's key, or null if it couldn't be made (the wall is then plain).
  get key(): string | null {
    return this.texture === null ? null : TEXTURE;
  }

  // The glass shading down to the floor, the cell grid with a dot at every
  // crossing, scanlines, and the neon's glow inside the edges. Lines land on
  // whole pixels, so they stay crisp.
  paint(layout: WallLayout): void {
    if (this.texture === null) return;
    const c = this.texture.getContext();
    const { width, height } = this.texture;
    const fit = coverFit(width, height, WALL_PANEL);
    const px = (x: number) => Math.round((x - fit.x) / fit.scale);
    const py = (y: number) => Math.round((y - fit.y) / fit.scale);
    const d = WALL_DISPLAY;

    c.save();
    c.globalAlpha = 1;
    const glass = c.createLinearGradient(0, 0, 0, height);
    glass.addColorStop(0, toCss(COLORS.panelTop));
    glass.addColorStop(1, toCss(COLORS.panelFoot));
    c.fillStyle = glass;
    c.fillRect(0, 0, width, height);

    const { xs, ys } = gridLines(layout);
    c.globalAlpha = d.gridAlpha;
    c.fillStyle = toCss(COLORS.panelGrid);
    for (const x of xs) c.fillRect(px(x), 0, d.gridWidth, height);
    for (const y of ys) c.fillRect(0, py(y), width, d.gridWidth);
    c.globalAlpha = d.dotAlpha;
    c.fillStyle = toCss(COLORS.panelDot);
    const half = Math.floor(d.dotSize / 2);
    for (const x of xs) for (const y of ys) c.fillRect(px(x) - half, py(y) - half, d.dotSize, d.dotSize);
    c.globalAlpha = d.scanAlpha;
    c.fillStyle = toCss(COLORS.panelScan);
    for (let y = 0; y < height; y += d.scanEvery) c.fillRect(0, y, width, 1);
    c.globalAlpha = 1;
    glowInside(c, 0, 0, width, height);
    c.restore();
    this.texture.refresh();
  }
}

// The neon frame's light on the glass: lime fading inward from every edge
// of the box at x, y. Also the title card's (M11 review 6), so the two glow
// alike.
export function glowInside(c: CanvasRenderingContext2D, x0: number, y0: number, width: number, height: number): void {
  const { glowDepth: depth, glowAlpha: alpha } = WALL_DISPLAY;
  const glow = Phaser.Display.Color.IntegerToColor(COLORS.panelGlow);
  const rgba = (a: number) => `rgba(${glow.red}, ${glow.green}, ${glow.blue}, ${a})`;
  const [x1, y1] = [x0 + width, y0 + height];
  // Each edge: where the glow starts, where it has faded, and the band it fills.
  const edges: readonly (readonly [number, number, number, number, number, number, number, number])[] = [
    [x0, y0, x0, y0 + depth, x0, y0, width, depth],
    [x0, y1, x0, y1 - depth, x0, y1 - depth, width, depth],
    [x0, y0, x0 + depth, y0, x0, y0, depth, height],
    [x1, y0, x1 - depth, y0, x1 - depth, y0, depth, height],
  ];
  for (const [x0, y0, x1, y1, x, y, w, h] of edges) {
    const fade = c.createLinearGradient(x0, y0, x1, y1);
    fade.addColorStop(0, rgba(alpha));
    fade.addColorStop(1, rgba(0));
    c.fillStyle = fade;
    c.fillRect(x, y, w, h);
  }
}
