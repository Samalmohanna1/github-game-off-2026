// The average color of each block of `block` × `block` pixels in RGBA data
// (as from getImageData) that is cols × rows blocks in size, as 0xRRGGBB, row
// by row. The image completion (M10b review) paints each of the figure's cells
// in the average color of the image under it.
export function blockAverages(rgba: ArrayLike<number>, cols: number, rows: number, block: number): number[] {
  const width = cols * block;
  const colors: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let [r, g, b] = [0, 0, 0];
      for (let y = row * block; y < (row + 1) * block; y++) {
        for (let x = col * block; x < (col + 1) * block; x++) {
          const i = (y * width + x) * 4;
          r += rgba[i] ?? 0;
          g += rgba[i + 1] ?? 0;
          b += rgba[i + 2] ?? 0;
        }
      }
      const mean = (sum: number) => Math.round(sum / (block * block));
      colors.push((mean(r) << 16) | (mean(g) << 8) | mean(b));
    }
  }
  return colors;
}
