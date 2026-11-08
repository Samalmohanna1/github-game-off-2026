import { AUDIO } from '@/config';
import { clickHz, fanfareHz, noteHz, rumbleCutoff, rumbleGain } from '@/logic/sound-levels';

const SILENT = 0.0001; // exponential ramps can't reach 0
const STOP_MARGIN = 0.05; // s a source runs past its envelope, so it never clicks off
const sec = (ms: number) => ms / 1000;

// White noise for the splash hiss; brown (integrated, so deeper) for the rumble.
function noiseBuffer(ctx: BaseAudioContext, seconds: number, brown: boolean): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = brown ? last * 3.5 : white;
  }
  return buffer;
}

// Every game sound, synthesized with Web Audio (PLAN.md §10, M9): no sound
// files. One-shot sounds are skipped unless the context is running, so nothing
// queues up before the browser unlocks audio on the first click, or plays
// while the window is blurred. Plain Web Audio, no Phaser: the scene hands in
// Phaser's context and master node, so Phaser's mute and volume still apply.
export class Synth {
  private readonly out: GainNode;
  private readonly whiteNoise: AudioBuffer;
  private readonly rumbleSource: AudioBufferSourceNode;
  private readonly rumbleFilter: BiquadFilterNode;
  private readonly rumbleLevel: GainNode;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = AUDIO.master;
    this.out.connect(destination);
    this.whiteNoise = noiseBuffer(ctx, 1, false);

    // The rumble loops for the whole run; its level decides when it is heard.
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = noiseBuffer(ctx, 2, true);
    this.rumbleSource.loop = true;
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = AUDIO.rumble.minCutoff;
    this.rumbleLevel = ctx.createGain();
    this.rumbleLevel.gain.value = 0;
    this.rumbleSource.connect(this.rumbleFilter).connect(this.rumbleLevel).connect(this.out);
    this.rumbleSource.start();
  }

  private get running(): boolean {
    return this.ctx.state === 'running';
  }

  // The approach rumble at progress t, or silence for null.
  setRumble(t: number | null): void {
    const now = this.ctx.currentTime;
    const smoothing = sec(AUDIO.rumble.smoothingMs);
    this.rumbleLevel.gain.setTargetAtTime(t === null ? 0 : rumbleGain(t), now, smoothing);
    this.rumbleFilter.frequency.setTargetAtTime(rumbleCutoff(t ?? 0), now, smoothing);
  }

  // A held letter; each one in the wall clicks a step higher.
  click(heldCount: number): void {
    if (!this.running) return;
    const { gain, ms } = AUDIO.click;
    const at = this.ctx.currentTime;
    this.tone('triangle', clickHz(heldCount), at, ms).connect(this.envelope(gain, 2, ms, at));
  }

  // A slip: a sad note sagging down.
  slip(): void {
    if (!this.running) return;
    const { gain, fromHz, toHz, ms } = AUDIO.slip;
    const at = this.ctx.currentTime;
    const note = this.tone('sawtooth', fromHz, at, ms);
    note.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    note.connect(this.lowpass(fromHz * 4)).connect(this.envelope(gain, 15, ms, at));
  }

  // PERFECT: a quick rising arpeggio, the last note held.
  fanfare(): void {
    if (!this.running) return;
    const { gain, noteMs, lastMs } = AUDIO.fanfare;
    const notes = fanfareHz();
    const start = this.ctx.currentTime;
    notes.forEach((hz, i) => {
      const at = start + sec(i * noteMs);
      const ms = i === notes.length - 1 ? lastMs : noteMs;
      this.tone('square', hz, at, ms).connect(this.lowpass(hz * 6)).connect(this.envelope(gain, 5, ms, at));
    });
  }

  // The figure hits the pool: a hiss sweeping down, under a low plunk.
  splash(): void {
    if (!this.running) return;
    const { gain, ms, fromHz, toHz, plunkFromHz, plunkToHz, plunkMs } = AUDIO.splash;
    const at = this.ctx.currentTime;

    const hiss = this.ctx.createBufferSource();
    hiss.buffer = this.whiteNoise;
    hiss.loop = true;
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(fromHz, at);
    band.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    hiss.connect(band).connect(this.envelope(gain, 8, ms, at));
    hiss.start(at);
    hiss.stop(at + sec(ms) + STOP_MARGIN);

    const plunk = this.tone('sine', plunkFromHz, at, plunkMs);
    plunk.frequency.exponentialRampToValueAtTime(plunkToHz, at + sec(plunkMs));
    plunk.connect(this.envelope(gain, 5, plunkMs, at));
  }

  // A fail: the crowd goes "oooh". Detuned voices with their own vibrato rise a
  // little as the sound swells, then sink, through two "oo" vowel formants.
  ooh(): void {
    if (!this.running) return;
    const o = AUDIO.ooh;
    const at = this.ctx.currentTime;
    const swelled = at + sec(o.swellMs);
    const end = at + sec(o.ms);

    const crowd = this.ctx.createGain();
    crowd.gain.value = 1 / Math.sqrt(o.voices);
    const envelope = this.envelope(o.gain, o.swellMs, o.ms, at);
    for (const hz of o.formantsHz) {
      const formant = this.ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = hz;
      formant.Q.value = o.formantQ;
      crowd.connect(formant).connect(envelope);
    }

    for (let i = 0; i < o.voices; i++) {
      const hz = noteHz(o.centerHz, (Math.random() * 2 - 1) * o.spreadSemitones);
      const voice = this.tone('sawtooth', hz, at, o.ms);
      voice.frequency.linearRampToValueAtTime(noteHz(hz, o.riseSemitones), swelled);
      voice.frequency.exponentialRampToValueAtTime(noteHz(hz, -o.fallSemitones), end);

      const vibrato = this.ctx.createOscillator();
      vibrato.frequency.value = o.vibratoHz * (0.8 + Math.random() * 0.4);
      const depth = this.ctx.createGain();
      depth.gain.value = o.vibratoDepthHz;
      vibrato.connect(depth).connect(voice.frequency);
      vibrato.start(at);
      vibrato.stop(end + STOP_MARGIN);

      voice.connect(crowd);
    }
  }

  // Stops the rumble. One-shot sounds still playing (the "oooh" runs past the
  // switch to the game-over screen) finish on their own.
  destroy(): void {
    this.rumbleSource.stop();
    this.rumbleSource.disconnect();
  }

  // Silence up to `peak` over attackMs, then back to silence by endMs.
  private envelope(peak: number, attackMs: number, endMs: number, at: number): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(SILENT, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + sec(attackMs));
    gain.gain.exponentialRampToValueAtTime(SILENT, at + sec(endMs));
    gain.connect(this.out);
    return gain;
  }

  private tone(type: OscillatorType, hz: number, at: number, ms: number): OscillatorNode {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, at);
    osc.start(at);
    osc.stop(at + sec(ms) + STOP_MARGIN);
    return osc;
  }

  private lowpass(hz: number): BiquadFilterNode {
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hz;
    return filter;
  }
}
