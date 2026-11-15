import Phaser from 'phaser';
import { COLORS, DARK_CARD, DISPLAY_FONT_FAMILY, FONT_SIZES, TEXT_COLORS, TITLE } from '@/config';
import { keyCapRect } from '@/logic/convex';
import type { Point } from '@/logic/perspective';
import { layoutTitleLockup, type WordInk } from '@/logic/title-lockup';
import { BAR_SLASHES_REACH, BAR_STEP, drawBarLine } from '@/objects/bar-line';
import { glowInside } from '@/objects/WallPanel';
import { toCss } from '@/scenes/text-styles';

const TEXTURE = 'title-lockup';

// Room round the card in its texture for the bloom outside its edge.
const BLOOM_ROOM = 2 * TITLE.bloom.blur;

const WORDS = { shape: 'SHAPE', shift: 'SHIFT' } as const;

function fontAt(size: number): string {
  return `${size}px ${DISPLAY_FONT_FAMILY}`;
}

function measureInk(ctx: CanvasRenderingContext2D, text: string, size: number): WordInk {
  ctx.font = fontAt(size);
  const m = ctx.measureText(text);
  return { inkLeft: -m.actualBoundingBoxLeft, inkRight: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}

// Sets a context to draw text leaning by TITLE.lean about its baseline, its
// pen starting at x, y.
function lean(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.setTransform(1, 0, -TITLE.lean, 1, x, y);
}

// How far left a word's first letter reaches once leaning, from its pen
// start. Leaning moves a curve's furthest point (the S's lower curve), which
// the font's measurements can't show, so this draws the letter and looks.
function leaningLeft(text: string, size: number): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx === null) return 0;
  const ink = measureInk(ctx, text.charAt(0), size);
  const pad = 2;
  const originX = pad - ink.inkLeft + ink.descent * TITLE.lean;
  canvas.width = Math.ceil(originX + ink.inkRight + ink.ascent * TITLE.lean + pad);
  canvas.height = Math.ceil(ink.ascent + ink.descent + 2 * pad);
  ctx.font = fontAt(size);
  lean(ctx, originX, pad + ink.ascent);
  ctx.fillText(text.charAt(0), 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) > 127) return x - originX;
    }
  }
  return ink.inkLeft;
}

function trace(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

// The dark card lit like a wall (M11 review 6): a lime bloom outside its lime
// edge, and the wall panel's neon glow inside it. Its top-left corner at x, y.
function drawLitCard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  const at = (p: Point) => ({ x: p.x + x, y: p.y + y });
  const face = keyCapRect(0, 0, width, height, DARK_CARD.cut).map(at);
  const edge = Phaser.Display.Color.IntegerToColor(COLORS.darkCardEdge);
  ctx.save();
  ctx.shadowColor = `rgba(${edge.red}, ${edge.green}, ${edge.blue}, ${TITLE.bloom.alpha})`;
  ctx.shadowBlur = TITLE.bloom.blur;
  ctx.fillStyle = toCss(COLORS.darkCardEdge);
  trace(ctx, keyCapRect(0, 0, width, height, DARK_CARD.cut, DARK_CARD.edgeWidth).map(at));
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = toCss(COLORS.darkCard);
  trace(ctx, face);
  ctx.fill();
  ctx.save();
  trace(ctx, face);
  ctx.clip();
  glowInside(ctx, x, y, width, height);
  ctx.restore();
}

// The title's lockup (M11 review 5, Option 2 of the user's title concepts;
// lit in review 6): SHAPE in cream over SHIFT in lime, in Anton, leaning like
// the badges, on a dark card lit like a wall, with the bar's line, half as
// big again, leading from under the S into SHIFT (layoutTitleLockup()).
// Phaser can't lean text, so the card and the words are drawn into a canvas
// texture. Its top-left corner is at its x, y; width and height are the
// card's.
export class TitleLockup extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    if (scene.textures.exists(TEXTURE)) scene.textures.remove(TEXTURE);
    const probe = document.createElement('canvas').getContext('2d');
    if (probe === null) return;
    const shape = measureInk(probe, WORDS.shape, FONT_SIZES.lockup);
    const shift = measureInk(probe, WORDS.shift, FONT_SIZES.lockupSub);
    const k = TITLE.motifScale;
    const layout = layoutTitleLockup(shape, shift, leaningLeft(WORDS.shape, FONT_SIZES.lockup), {
      ...TITLE,
      lowRun: TITLE.lowRun * k,
      lineRise: TITLE.sTerminal * FONT_SIZES.lockupSub,
      step: { across: BAR_STEP.across * k, drop: BAR_STEP.drop * k },
      slashesReach: BAR_SLASHES_REACH * k,
    });
    const [width, height] = [Math.ceil(layout.width), Math.ceil(layout.height)];
    this.setSize(width, height);

    const texture = scene.textures.createCanvas(TEXTURE, width + 2 * BLOOM_ROOM, height + 2 * BLOOM_ROOM);
    if (texture === null) return;
    const ctx = texture.getContext();
    drawLitCard(ctx, BLOOM_ROOM, BLOOM_ROOM, width, height);
    for (const [word, size, at, color] of [
      [WORDS.shape, FONT_SIZES.lockup, layout.shape, TEXT_COLORS.light],
      [WORDS.shift, FONT_SIZES.lockupSub, layout.shift, TEXT_COLORS.good],
    ] as const) {
      ctx.fillStyle = color;
      ctx.font = fontAt(size);
      lean(ctx, at.x + BLOOM_ROOM, at.y + BLOOM_ROOM);
      ctx.fillText(word, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    texture.refresh();

    const line = new Phaser.GameObjects.Graphics(scene);
    drawBarLine(line, layout.line, k);
    this.add([new Phaser.GameObjects.Image(scene, -BLOOM_ROOM, -BLOOM_ROOM, TEXTURE).setOrigin(0), line]);
  }
}
