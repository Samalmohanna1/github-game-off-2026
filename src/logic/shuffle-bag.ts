import { shuffled, type Random } from '@/logic/random';

// Deals items in a shuffled order, each once before any comes round again,
// and never the same one twice in a row across a reshuffle. The wall images
// (M10b) come from one, so a small set still varies from wall to wall.
export class ShuffleBag<T> {
  private bag: T[] = [];
  private last: T | undefined;

  constructor(
    private readonly items: readonly T[],
    private readonly random: Random = Math.random,
  ) {}

  next(): T | undefined {
    if (this.items.length === 0) return undefined;
    if (this.bag.length === 0) {
      this.bag = shuffled(this.items, this.random);
      // Dealt from the end, so a repeat of the last item swaps to the front.
      const end = this.bag.length - 1;
      if (end > 0 && this.bag[end] === this.last) [this.bag[0], this.bag[end]] = [this.bag[end]!, this.bag[0]!];
    }
    this.last = this.bag.pop();
    return this.last;
  }
}
