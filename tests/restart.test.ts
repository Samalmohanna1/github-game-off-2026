import { describe, expect, it } from 'vitest';
import { RESTART_LOCKOUT } from '@/config';
import { RestartGate } from '@/logic/restart';

describe('RestartGate', () => {
  it('ignores input during the lockout', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT - 1);
    expect(gate.press('Space')).toBe(false);
    expect(gate.click()).toBe(false);
  });

  it.each(['Space', 'Enter', 'NumpadEnter'])('restarts on a fresh %s once the lockout is over and no key is down', (code) => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.ready).toBe(true);
    expect(gate.press(code)).toBe(true);
  });

  it('restarts on no other key, which must be let go before Space or Enter can', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.press('KeyA')).toBe(false);
    expect(gate.press('Space')).toBe(false);
    gate.release('KeyA');
    gate.release('Space');
    expect(gate.press('Enter')).toBe(true);
  });

  it('restarts on a click once ready', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.click()).toBe(true);
  });

  it('waits for keys held from the failed wall to be released', () => {
    const gate = new RestartGate(['KeyA', 'ShiftLeft']);
    gate.tick(RESTART_LOCKOUT * 3);
    expect(gate.lockoutOver).toBe(true);
    expect(gate.ready).toBe(false);
    expect(gate.click()).toBe(false);

    gate.release('KeyA');
    expect(gate.ready).toBe(false);
    gate.release('ShiftLeft');
    expect(gate.ready).toBe(true);
  });

  it('does not restart on a press made during the lockout, even after it ends', () => {
    const gate = new RestartGate([]);
    expect(gate.press('KeyJ')).toBe(false);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.ready).toBe(false);
    gate.release('KeyJ');
    expect(gate.ready).toBe(true);
  });

  it('counts a key repeat as a key still down', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT);
    gate.holding('KeyK');
    expect(gate.ready).toBe(false);
  });

  it('forgets held keys after losing focus', () => {
    const gate = new RestartGate(['KeyA']);
    gate.tick(RESTART_LOCKOUT);
    gate.forgetKeys();
    expect(gate.ready).toBe(true);
  });

  it("waits a lockout of its own when given one (the tutorial's Start)", () => {
    const gate = new RestartGate([], RESTART_LOCKOUT * 2);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.lockoutOver).toBe(false);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.ready).toBe(true);
  });
});
