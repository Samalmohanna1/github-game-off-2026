import Phaser from 'phaser';
import { DISPLAY_FONT_FAMILY, FONT_SIZES, TEXT_COLORS, TITLE } from '@/config';
import { layoutTitleLockup, type WordInk } from '@/logic/title-lockup';
import { BAR_SLASHES_REACH, BAR_STEP, drawBarLine } from '@/objects/bar-line';
import { drawDarkCard } from '@/objects/card';

const TEXTURE = 'title-lockup';

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

// The title's lockup (M11 review 5, Option 2 of the user's title concepts):
// SHAPE over SHIFT in cream Anton, leaning like the badges, on a dark card,
// with the bar's line leading from under the S into SHIFT
// (layoutTitleLockup()). Phaser can't lean text, so the words are drawn into
// a canvas texture. Its top-left corner is at its x, y; width and height are
// the card's.
export class TitleLockup extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    if (scene.textures.exists(TEXTURE)) scene.textures.remove(TEXTURE);
    const probe = document.createElement('canvas').getContext('2d');
    if (probe === null) return;
    const shape = measureInk(probe, WORDS.shape, FONT_SIZES.lockup);
    const shift = measureInk(probe, WORDS.shift, FONT_SIZES.lockupSub);
    const layout = layoutTitleLockup(shape, shift, leaningLeft(WORDS.shape, FONT_SIZES.lockup), {
      ...TITLE,
      step: BAR_STEP,
      slashesReach: BAR_SLASHES_REACH,
    });
    const [width, height] = [Math.ceil(layout.width), Math.ceil(layout.height)];
    this.setSize(width, height);

    const card = new Phaser.GameObjects.Graphics(scene);
    drawDarkCard(card, 0, 0, width, height);
    drawBarLine(card, layout.line);

    const texture = scene.textures.createCanvas(TEXTURE, width, height);
    if (texture === null) return;
    const ctx = texture.getContext();
    ctx.fillStyle = TEXT_COLORS.light;
    for (const [word, size, at] of [
      [WORDS.shape, FONT_SIZES.lockup, layout.shape],
      [WORDS.shift, FONT_SIZES.lockupSub, layout.shift],
    ] as const) {
      ctx.font = fontAt(size);
      lean(ctx, at.x, at.y);
      ctx.fillText(word, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    texture.refresh();

    this.add([card, new Phaser.GameObjects.Image(scene, 0, 0, TEXTURE).setOrigin(0)]);
  }
}
