import type Phaser from 'phaser';
import { WALL_IMAGES } from '@/data/wall-images';

// Starts loading the wall images in the background (M10b review), so the
// title shows at once instead of waiting for every image: each is added to
// the game's textures as it arrives, and walls use whichever have arrived
// (wallImageKeys()). One that fails is left out. Call once, from BootScene.
export function loadWallImages(textures: Phaser.Textures.TextureManager): void {
  for (const { key, url } of WALL_IMAGES) {
    if (textures.exists(key)) continue;
    const image = new Image();
    image.onload = () => {
      if (!textures.exists(key)) textures.addImage(key, image);
    };
    image.src = url;
  }
}

// The wall images loaded so far.
export function wallImageKeys(textures: Phaser.Textures.TextureManager): string[] {
  return WALL_IMAGES.map(({ key }) => key).filter((key) => textures.exists(key));
}
