import Phaser from 'phaser';
import {
  CHIP,
  CHIP_FONT_FAMILY,
  COLORS,
  GAME_WIDTH,
  SHIFT_MARK,
  STAGE_BOTTOM_Y,
  TEXT_COLORS,
  TRAY_HEIGHT,
} from '@/config';
import { isUppercaseLetter, type SequenceView } from '@/logic/sequence';
import { textStyle } from '@/scenes/text-styles';
import { prefersReducedMotion } from '@/scenes/ui';

const MID_Y = STAGE_BOTTOM_Y + TRAY_HEIGHT / 2;
const STEP = CHIP.size + CHIP.gap;
const FIRST_HELD_X = CHIP.edgeInset + CHIP.size / 2;
const FIRST_RIGHT_X = GAME_WIDTH / 2 + CHIP.currentSize / 2 + 2 * CHIP.gap + CHIP.size / 2;

type ChipKind = 'held' | 'current' | 'next' | 'slipped';

interface ChipLook {
  readonly fill: number;
  readonly edge: number | null;
  readonly text: keyof typeof TEXT_COLORS;
  readonly mark: number;
}

// Key caps on the black tray (M10): cream for the current letter, green once
// held, coral when slipped, and a hollow cream outline for the preview.
const LOOKS: Readonly<Record<ChipKind, ChipLook>> = {
  held: { fill: COLORS.chipHeld, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
  current: { fill: COLORS.chipCurrent, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
  next: { fill: COLORS.chipNext, edge: COLORS.chipNextEdge, text: 'light', mark: COLORS.chipNextEdge },
  slipped: { fill: COLORS.chipSlipped, edge: null, text: 'ink', mark: COLORS.chipShiftMark },
};

interface ChipSpec {
  readonly letter: string;
  readonly kind: ChipKind;
  readonly x: number;
  readonly size: number;
}

// The Shift key's hollow up arrow, in a unit square. Drawn rather than typed so
// it never depends on a font having the ⇧ glyph.
const SHIFT_ARROW: readonly [number, number][] = [
  [0.5, 0],
  [1, 0.55],
  [0.72, 0.55],
  [0.72, 1],
  [0.28, 1],
  [0.28, 0.55],
  [0, 0.55],
];

function layout(view: SequenceView): ChipSpec[] {
  const upcoming: ChipSpec[] = [
    ...(view.next !== null ? [{ letter: view.next, kind: 'next' as const }] : []),
    ...view.slipped.map((letter) => ({ letter, kind: 'slipped' as const })),
  ].map((chip, i) => ({ ...chip, x: FIRST_RIGHT_X + i * STEP, size: CHIP.size }));
  return [
    ...view.held.map((letter, i) => ({ letter, kind: 'held' as const, x: FIRST_HELD_X + i * STEP, size: CHIP.size })),
    ...(view.current !== null
      ? [{ letter: view.current, kind: 'current' as const, x: GAME_WIDTH / 2, size: CHIP.currentSize }]
      : []),
    ...upcoming,
  ];
}

// Letters keep their case: uppercase means "hold Shift" (AGENTS.md). Capitals
// also carry the Shift mark, because case alone is hard to read in a lone chip
// (o/O, s/S, x/X differ only in size).
export class PromptTray extends Phaser.GameObjects.Container {
  private chips: Phaser.GameObjects.Container[] = [];
  // Where each letter sat last time, so a new current letter can slide in from there.
  private lastX = new Map<string, number>();
  private shown = '';

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);

    // A plain black strip along the bottom, like the mocks' prompt bar.
    const background = new Phaser.GameObjects.Rectangle(scene, 0, STAGE_BOTTOM_Y, GAME_WIDTH, TRAY_HEIGHT, COLORS.tray);
    this.add(background.setOrigin(0, 0));
  }

  show(view: SequenceView): void {
    const key = JSON.stringify(view);
    if (key === this.shown) return;
    this.shown = key;

    for (const chip of this.chips) chip.destroy();
    const specs = layout(view);
    this.chips = specs.map((spec) => this.addChip(spec));
    this.lastX = new Map(specs.map((spec) => [spec.letter, spec.x]));
  }

  private addChip(spec: ChipSpec): Phaser.GameObjects.Container {
    const look = LOOKS[spec.kind];
    const half = spec.size / 2;
    const shape = new Phaser.GameObjects.Graphics(this.scene);
    shape.fillStyle(look.fill);
    shape.fillRoundedRect(-half, -half, spec.size, spec.size, CHIP.radius);
    if (look.edge !== null) {
      shape.lineStyle(CHIP.nextEdgeWidth, look.edge);
      shape.strokeRoundedRect(-half, -half, spec.size, spec.size, CHIP.radius);
    }
    if (isUppercaseLetter(spec.letter)) drawShiftMark(shape, spec.size, look.mark);

    const text = new Phaser.GameObjects.Text(this.scene, 0, 0, spec.letter, {
      ...textStyle('chip', look.text, true),
      fontFamily: CHIP_FONT_FAMILY,
    }).setOrigin(0.5);

    const chip = new Phaser.GameObjects.Container(this.scene, spec.x, MID_Y, [shape, text]);
    this.add(chip);
    this.slideIn(chip, spec);
    return chip;
  }

  // A letter that becomes current glides from its spot on the right to the
  // center, growing to full size.
  private slideIn(chip: Phaser.GameObjects.Container, spec: ChipSpec): void {
    const from = this.lastX.get(spec.letter);
    if (spec.kind !== 'current' || from === undefined || from === spec.x || prefersReducedMotion()) return;
    chip.setX(from).setScale(CHIP.size / CHIP.currentSize);
    this.scene.tweens.add({ targets: chip, x: spec.x, scale: 1, duration: CHIP.slideMs, ease: 'Quad.easeOut' });
  }
}

function drawShiftMark(shape: Phaser.GameObjects.Graphics, chipSize: number, color: number): void {
  const markSize = chipSize * SHIFT_MARK.size;
  const inset = chipSize * SHIFT_MARK.inset;
  const left = chipSize / 2 - inset - markSize;
  const top = -chipSize / 2 + inset;
  shape.lineStyle(SHIFT_MARK.lineWidth, color);
  shape.strokePoints(
    SHIFT_ARROW.map(([u, v]) => new Phaser.Math.Vector2(left + u * markSize, top + v * markSize)),
    true,
  );
}
