import { describe, expect, it } from 'vitest';
import { GRADE_BONUS, GREAT_T, MAX_MULTIPLIER, PERFECT_T, WALL_CLEAR_POINTS } from '@/config';
import { ScoreKeeper, gradeFor } from '@/logic/scoring';

const PERFECT_POINTS = WALL_CLEAR_POINTS + GRADE_BONUS.perfect;

describe('gradeFor', () => {
  it('grades by how early the pose locked, thresholds inclusive', () => {
    expect(gradeFor(0.1)).toBe('perfect');
    expect(gradeFor(PERFECT_T)).toBe('perfect');
    expect(gradeFor(PERFECT_T + 0.01)).toBe('great');
    expect(gradeFor(GREAT_T)).toBe('great');
    expect(gradeFor(GREAT_T + 0.01)).toBe('closeCall');
  });
});

describe('ScoreKeeper', () => {
  it('scores the wall plus the timing bonus', () => {
    const k = new ScoreKeeper();
    expect(k.clearWall(0.6)).toEqual({ grade: 'great', points: WALL_CLEAR_POINTS + GRADE_BONUS.great, multiplier: 1 });
    expect(k.clearWall(0.9)).toEqual({
      grade: 'closeCall',
      points: WALL_CLEAR_POINTS + GRADE_BONUS.closeCall,
      multiplier: 1,
    });
    expect(k.score).toBe(2 * WALL_CLEAR_POINTS + GRADE_BONUS.great + GRADE_BONUS.closeCall);
    expect(k.wallsCleared).toBe(2);
    expect(k.wallNumber).toBe(3);
  });

  it('can start further in, counting only the walls actually cleared', () => {
    const k = new ScoreKeeper(13);
    expect(k.wallNumber).toBe(13);
    k.clearWall(0.6);
    expect(k.wallNumber).toBe(14);
    expect(k.wallsCleared).toBe(1);
  });

  it('grows the multiplier by 0.5 per PERFECT already in the streak', () => {
    const k = new ScoreKeeper();
    expect(k.clearWall(0.1).multiplier).toBe(1);
    expect(k.clearWall(0.1).multiplier).toBe(1.5);
    const third = k.clearWall(0.1);
    expect(third.multiplier).toBe(2);
    expect(third.points).toBe(PERFECT_POINTS * 2);
  });

  it('caps the multiplier', () => {
    const k = new ScoreKeeper();
    for (let i = 0; i < 10; i++) k.clearWall(0);
    expect(k.clearWall(0).multiplier).toBe(MAX_MULTIPLIER);
  });

  it('resets the streak on anything but PERFECT', () => {
    const k = new ScoreKeeper();
    k.clearWall(0.1);
    k.clearWall(0.1);
    expect(k.clearWall(0.6).multiplier).toBe(1);
    expect(k.streak).toBe(0);
    expect(k.clearWall(0.1).multiplier).toBe(1);
  });
});
