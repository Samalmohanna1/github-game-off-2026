const SCROLL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

// Game-wide, not per scene: inside the itch.io iframe these keys would
// otherwise scroll the host page on any screen, held-key repeats included.
export function preventPageScroll(): void {
  window.addEventListener('keydown', (event) => {
    if (SCROLL_KEYS.has(event.key)) event.preventDefault();
  });
}
