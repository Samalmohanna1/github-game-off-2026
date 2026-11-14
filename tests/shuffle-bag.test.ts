import { describe, expect, it } from 'vitest';
import { ShuffleBag } from '@/logic/shuffle-bag';
import { seeded } from './seeded';

describe('ShuffleBag', () => {
  it('deals every item once before any repeats', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const bag = new ShuffleBag(items, seeded(3));
    for (let round = 0; round < 20; round++) {
      const dealt = items.map(() => bag.next());
      expect([...dealt].sort()).toEqual(items);
    }
  });

  it('never deals the same item twice in a row, even across a reshuffle', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const bag = new ShuffleBag(['a', 'b', 'c'], seeded(seed));
      let last = bag.next();
      for (let i = 0; i < 60; i++) {
        const next = bag.next();
        expect(next).not.toBe(last);
        last = next;
      }
    }
  });

  it('keeps dealing a lone item, and nothing from an empty bag', () => {
    const one = new ShuffleBag(['only']);
    expect([one.next(), one.next(), one.next()]).toEqual(['only', 'only', 'only']);
    expect(new ShuffleBag<string>([]).next()).toBeUndefined();
  });
});
