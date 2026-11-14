// The wall images (M10b): every PNG, JPEG or WebP in src/assets/walls/,
// bundled by Vite, so adding one is just dropping the file in and restarting
// the dev server (src/assets/walls/README.md). Sorted by file name; each key
// is the file name.
const urls = import.meta.glob<string>('../assets/walls/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
  caseSensitive: false,
});

export interface WallImage {
  readonly key: string;
  readonly url: string;
}

export const WALL_IMAGES: readonly WallImage[] = Object.entries(urls)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => ({ key: `wall-image:${path.slice(path.lastIndexOf('/') + 1)}`, url }));
