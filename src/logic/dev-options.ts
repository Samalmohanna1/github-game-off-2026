// Playtest shortcuts read from the page URL, on the dev server only (README):
// ?wall=13 starts every run at wall 13, and ?shiftwall makes every wall a
// Shift Wall. Anything missing or invalid falls back to a normal run, which is
// always NO_DEV_OPTIONS itself.
export interface DevOptions {
  readonly startWall: number;
  readonly forceShiftWall: boolean;
}

export const NO_DEV_OPTIONS: DevOptions = { startWall: 1, forceShiftWall: false };

export function parseDevOptions(search: string): DevOptions {
  const params = new URLSearchParams(search);
  const wall = Number(params.get('wall'));
  const shiftWall = params.get('shiftwall');
  const startWall = Number.isInteger(wall) && wall >= 1 ? wall : NO_DEV_OPTIONS.startWall;
  const forceShiftWall = shiftWall !== null && shiftWall !== '0';
  if (startWall === NO_DEV_OPTIONS.startWall && !forceShiftWall) return NO_DEV_OPTIONS;
  return { startWall, forceShiftWall };
}
