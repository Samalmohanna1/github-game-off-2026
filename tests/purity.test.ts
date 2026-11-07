import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the "keep game logic separate from Phaser" rule (PLAN.md §1): everything
// the rules depend on must stay importable without Phaser so it runs in plain Node.

const ROOT = join(import.meta.dirname, '..');
const PURE_PATHS = ['src/logic', 'src/data', 'src/config.ts'];

const PHASER_IMPORT = /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"]phaser(?:\/[^'"]*)?['"]/;
// Scenes, objects and input wrap Phaser, so pure code may not reach into them either.
const IMPURE_INTERNAL_IMPORT = /(?:from\s*|import\s*\(?\s*)['"](?:@\/|\.{1,2}\/(?:[^'"]*\/)?)(?:scenes|objects|input)\//;

function tsFilesUnder(relPath: string): string[] {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return [];
  if (abs.endsWith('.ts')) return [abs];
  return readdirSync(abs, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.ts'))
    .map((name) => join(abs, name));
}

describe('pure modules', () => {
  const files = PURE_PATHS.flatMap(tsFilesUnder);

  it('finds the files it is meant to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('never import Phaser', () => {
    const offenders = files.filter((f) => PHASER_IMPORT.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it('never import scenes, objects or input', () => {
    const offenders = files.filter((f) => IMPURE_INTERNAL_IMPORT.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it('detects the imports it forbids', () => {
    expect(PHASER_IMPORT.test("import Phaser from 'phaser';")).toBe(true);
    expect(PHASER_IMPORT.test('import type { Scene } from "phaser";')).toBe(true);
    expect(PHASER_IMPORT.test("const P = await import('phaser');")).toBe(true);
    expect(PHASER_IMPORT.test("import { LANE_COUNT } from '@/config';")).toBe(false);
    expect(IMPURE_INTERNAL_IMPORT.test("import { Wall } from '@/objects/Wall';")).toBe(true);
    expect(IMPURE_INTERNAL_IMPORT.test("import { Wall } from '../objects/Wall';")).toBe(true);
    expect(IMPURE_INTERNAL_IMPORT.test("import { SceneKeys } from '@/scenes/scene-keys';")).toBe(true);
    expect(IMPURE_INTERNAL_IMPORT.test("import { POSES } from '@/data/poses';")).toBe(false);
  });
});
