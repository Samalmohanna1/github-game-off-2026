import { DISPLAY_FONT_FAMILY, FONT_FAMILY, FONT_LOAD_TIMEOUT, FONT_SIZES } from '@/config';

// Every face the game draws with (M10): Anton, and IBM Plex Mono regular and
// bold. The @font-face rules come from the @fontsource CSS imported in main.ts.
const FACES = [
  `${FONT_SIZES.heading}px ${DISPLAY_FONT_FAMILY}`,
  `${FONT_SIZES.body}px ${FONT_FAMILY}`,
  `bold ${FONT_SIZES.body}px ${FONT_FAMILY}`,
];

// Phaser rasterizes text once, with whatever font is ready at that moment, so
// the fonts must load before any scene sets text. A slow or failed load gives
// up after FONT_LOAD_TIMEOUT and the game runs on the fallback fonts.
export async function loadFonts(): Promise<void> {
  const loaded = Promise.all(FACES.map((face) => document.fonts.load(face))).then(
    () => undefined,
    () => undefined,
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_LOAD_TIMEOUT));
  await Promise.race([loaded, timeout]);
}
