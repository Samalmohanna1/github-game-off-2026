import Phaser from 'phaser';
import { WALL_PANEL, coverFit, cropOf, type Rect } from '@/logic/wall-shape';

// Pieces of one wall image, each cropped to a rect of the wall, so together
// they show the image only inside those rects. Every piece is the whole image,
// scaled to cover the wall panel (WALL_PANEL) and cropped, so neighboring
// pieces, and pieces in another ImagePieces at the same place, line up exactly.
// In wall space: add it to something positioned and scaled like the wall.
export class ImagePieces extends Phaser.GameObjects.Container {
  private readonly pool: Phaser.GameObjects.Image[] = [];

  show(key: string | null, rects: readonly Rect[]): void {
    this.pool.forEach((piece) => piece.setVisible(false));
    if (key === null) return;
    const frame = this.scene.textures.getFrame(key);
    const fit = coverFit(frame.width, frame.height, WALL_PANEL);
    rects.forEach((rect, i) => {
      const piece = this.pool[i] ?? this.addPiece(key);
      const crop = cropOf(rect, fit);
      piece.setTexture(key).setPosition(fit.x, fit.y).setScale(fit.scale);
      piece.setCrop(crop.x, crop.y, crop.width, crop.height).setVisible(true);
    });
  }

  private addPiece(key: string): Phaser.GameObjects.Image {
    const piece = new Phaser.GameObjects.Image(this.scene, 0, 0, key).setOrigin(0, 0);
    this.pool.push(piece);
    this.add(piece);
    return piece;
  }
}
