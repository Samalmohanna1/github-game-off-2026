import { describe, expect, it } from 'vitest';
import { blockAverages } from '@/logic/mosaic';

// RGBA data, cols × rows blocks of block × block pixels, filled by colorAt(x, y).
function image(cols: number, rows: number, block: number, colorAt: (x: number, y: number) => number): number[] {
  const data: number[] = [];
  for (let y = 0; y < rows * block; y++) {
    for (let x = 0; x < cols * block; x++) {
      const c = colorAt(x, y);
      data.push((c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff, 255);
    }
  }
  return data;
}

describe('blockAverages', () => {
  it('gives each flat block its own color, row by row', () => {
    const colors = [0x112233, 0x445566, 0x778899, 0xaabbcc];
    const data = image(2, 2, 3, (x, y) => colors[Math.floor(y / 3) * 2 + Math.floor(x / 3)]!);
    expect(blockAverages(data, 2, 2, 3)).toEqual(colors);
  });

  it('averages the pixels within a block', () => {
    // Half black, half white: mid gray (127.5 rounds to 128).
    const data = image(1, 1, 2, (x) => (x === 0 ? 0x000000 : 0xffffff));
    expect(blockAverages(data, 1, 1, 2)).toEqual([0x808080]);
  });
});
