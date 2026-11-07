import { describe, expect, it } from 'vitest';
import { RESTART_LOCKOUT } from '@/config';
import { RestartGate } from '@/logic/restart';

describe('RestartGate', () => {
  it('ignores input during the lockout', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT - 1);
    expect(gate.press('KeyA')).toBe(false);
    expect(gate.click()).toBe(false);
  });

  it('restarts on a fresh press once the lockout is over and no key is down', () => {
    const gate = new RestartGate([]);
    gate.tick(RESTART_LOCKOUT);
    expect(gate.ready).toBe(true);
    expect(gate.press('Space')).toBe(true);
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
});
