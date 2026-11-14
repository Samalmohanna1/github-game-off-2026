import { pick, randomInt, shuffled, type Random } from '@/logic/random';

// The motifs a pattern tile can carry (drawn by WallPattern): a quarter disc
// from a corner, a half disc on an edge, a disc, a ring, a diagonal half, a
// straight half, stripes, a diamond, and four dots.
export const MOTIFS = ['quarter', 'half', 'circle', 'ring', 'triangle', 'split', 'stripes', 'diamond', 'dots'] as const;
export type Motif = (typeof MOTIFS)[number];

export interface PatternTile {
  readonly col: number;
  readonly row: number;
  readonly motif: Motif | null; // null: bare ground
  readonly turn: 0 | 1 | 2 | 3; // quarter turns
  readonly ground: number; // color indices into the wall's scheme
  readonly ink: number;
}

// Square tiles `size` px, in cols × rows, the first column starting `left` px
// from the panel's left edge (zero or less), so the tiles cover the panel and
// sit centered on it.
export interface WallPatternSpec {
  readonly size: number;
  readonly left: number;
  readonly cols: number;
  readonly rows: number;
  readonly tiles: readonly PatternTile[];
}

export interface PatternRules {
  readonly rows: readonly number[];
  readonly motifsPerWall: number;
  readonly plainShare: number;
  readonly accentShare: number;
}

// A fresh geometric pattern for a wall (M10b review 3): a quilt of square
// tiles `rows` high, each a motif in one color on a ground in another. The
// wall's scheme has `colors` colors: the first two are grounds, the last is
// the accent, which inks only now and then. Each wall uses a few motifs, so
// it has a character of its own, and some tiles are left bare for rest.
export function makePattern(
  width: number,
  height: number,
  colors: number,
  rules: PatternRules,
  random: Random,
): WallPatternSpec {
  const rows = pick(rules.rows, random) ?? rules.rows[0] ?? 1;
  const size = height / rows;
  const cols = Math.ceil(width / size);
  const left = (width - cols * size) / 2;
  const motifs = shuffled(MOTIFS, random).slice(0, rules.motifsPerWall);
  const accent = colors - 1;
  const tiles: PatternTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ground = random() < 0.5 ? 0 : 1;
      const inks = Array.from({ length: colors }, (_, i) => i).filter(
        (i) => i !== ground && (i !== accent || random() < rules.accentShare),
      );
      tiles.push({
        col,
        row,
        motif: random() < rules.plainShare ? null : (pick(motifs, random) ?? null),
        turn: randomInt(0, 3, random) as PatternTile['turn'],
        ground,
        ink: pick(inks, random) ?? 1 - ground,
      });
    }
  }
  return { size, left, cols, rows, tiles };
}
