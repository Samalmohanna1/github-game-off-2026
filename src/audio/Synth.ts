import { AUDIO } from '@/config';
import { clickHz, fanfareHz } from '@/logic/sound-levels';

const SILENT = 0.0001; // exponential ramps can't reach 0
const STOP_MARGIN = 0.05; // s a source runs past its envelope, so it never clicks off
const sec = (ms: number) => ms / 1000;

function whiteNoise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Every game sound, synthesized with Web Audio (PLAN.md §10, M9): no sound
// files. Sounds are skipped unless the context is running, so nothing queues
// up before the browser unlocks audio on the first click, or plays while the
// window is blurred. Plain Web Audio, no Phaser: the scene hands in Phaser's
// context and master node, so Phaser's mute and volume still apply.
export class Synth {
  private readonly out: GainNode;
  private readonly noise: AudioBuffer;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = AUDIO.master;
    this.out.connect(destination);
    this.noise = whiteNoise(ctx, 1);
  }

  private get running(): boolean {
    return this.ctx.state === 'running';
  }

  // The countdown: index alternates a higher tick and a lower tock.
  tick(index: number): void {
    if (!this.running) return;
    const { gain, tickHz, tockHz, ms } = AUDIO.tick;
    const at = this.ctx.currentTime;
    const hz = index % 2 === 0 ? tickHz : tockHz;
    this.tone('square', hz, at, ms).connect(this.filter('bandpass', hz, 4)).connect(this.envelope(gain, 1, ms, at));
  }

  // A held letter; each one in the wall clicks a step higher.
  click(heldCount: number): void {
    if (!this.running) return;
    const { gain, ms } = AUDIO.click;
    const at = this.ctx.currentTime;
    this.tone('triangle', clickHz(heldCount), at, ms).connect(this.envelope(gain, 2, ms, at));
  }

  // A slip: a quick "bloop" deflating, with a wobble.
  slip(): void {
    if (!this.running) return;
    const { gain, fromHz, toHz, ms, wobbleHz, wobbleDepthHz } = AUDIO.slip;
    const at = this.ctx.currentTime;
    const note = this.tone('sine', fromHz, at, ms);
    note.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    this.wobble(note, wobbleHz, wobbleDepthHz, at, ms);
    note.connect(this.envelope(gain, 5, ms, at));
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
      this.tone('square', hz, at, ms).connect(this.filter('lowpass', hz * 6)).connect(this.envelope(gain, 5, ms, at));
    });
  }

  // Shift Wall warning: rising chirps, heard from the side the hole is going.
  shiftAlert(dir: -1 | 1): void {
    if (!this.running) return;
    const { gain, fromHz, toHz, chirps, chirpMs, gapMs, pan } = AUDIO.shiftAlert;
    const start = this.ctx.currentTime;
    const side = this.panner(dir * pan);
    for (let i = 0; i < chirps; i++) {
      const at = start + sec(i * gapMs);
      const chirp = this.tone('square', fromHz, at, chirpMs);
      chirp.frequency.exponentialRampToValueAtTime(toHz, at + sec(chirpMs));
      chirp.connect(this.filter('lowpass', toHz * 3)).connect(this.envelope(gain, 5, chirpMs, at, side));
    }
  }

  // The hole slides: a rising whoosh the same way.
  whoosh(dir: -1 | 1): void {
    if (!this.running) return;
    const { gain, fromHz, toHz, ms, pan } = AUDIO.whoosh;
    const at = this.ctx.currentTime;
    const band = this.filter('bandpass', fromHz, 1.2);
    band.frequency.setValueAtTime(fromHz, at);
    band.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    this.noiseBurst(at, ms).connect(band).connect(this.envelope(gain, ms / 2, ms, at, this.panner(dir * pan)));
  }

  // The wall hits the figure: a low thump under a short smack, with no lead-in.
  hit(): void {
    if (!this.running) return;
    const { gain, fromHz, toHz, ms, smackMs, smackCutoffHz } = AUDIO.hit;
    const at = this.ctx.currentTime;
    const thump = this.tone('sine', fromHz, at, ms);
    thump.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    thump.connect(this.envelope(gain, 2, ms, at));
    this.noiseBurst(at, smackMs).connect(this.filter('lowpass', smackCutoffHz)).connect(this.envelope(gain, 1, smackMs, at));
  }

  // The figure lands in the pool: a hiss sweeping down, a low plunk, then
  // scattered droplets.
  splash(): void {
    if (!this.running) return;
    const s = AUDIO.splash;
    const at = this.ctx.currentTime;

    const band = this.filter('bandpass', s.fromHz, 0.8);
    band.frequency.setValueAtTime(s.fromHz, at);
    band.frequency.exponentialRampToValueAtTime(s.toHz, at + sec(s.ms));
    this.noiseBurst(at, s.ms).connect(band).connect(this.envelope(s.gain, 8, s.ms, at));

    const plunk = this.tone('sine', s.plunkFromHz, at, s.plunkMs);
    plunk.frequency.exponentialRampToValueAtTime(s.plunkToHz, at + sec(s.plunkMs));
    plunk.connect(this.envelope(s.gain, 5, s.plunkMs, at));

    const [lowHz, highHz] = s.dropletHz;
    for (let i = 0; i < s.droplets; i++) {
      const dropAt = at + sec(Math.random() * s.dropletSpreadMs);
      const fromHz = lowHz + Math.random() * (highHz - lowHz) * 0.5;
      const drop = this.tone('sine', fromHz, dropAt, s.dropletMs);
      drop.frequency.exponentialRampToValueAtTime(fromHz + (highHz - lowHz) / 2, dropAt + sec(s.dropletMs));
      drop.connect(this.envelope(s.gain / 3, 3, s.dropletMs, dropAt));
    }
  }

  // Silence up to `peak` over attackMs, then back to silence by endMs.
  private envelope(peak: number, attackMs: number, endMs: number, at: number, to: AudioNode = this.out): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(SILENT, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + sec(attackMs));
    gain.gain.exponentialRampToValueAtTime(SILENT, at + sec(endMs));
    gain.connect(to);
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

  private noiseBurst(at: number, ms: number): AudioBufferSourceNode {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.start(at);
    source.stop(at + sec(ms) + STOP_MARGIN);
    return source;
  }

  // Vibrato: a slow oscillator nudging the note's pitch up and down.
  private wobble(note: OscillatorNode, hz: number, depthHz: number, at: number, ms: number): void {
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = hz;
    const depth = this.ctx.createGain();
    depth.gain.value = depthHz;
    lfo.connect(depth).connect(note.frequency);
    lfo.start(at);
    lfo.stop(at + sec(ms) + STOP_MARGIN);
  }

  private filter(type: BiquadFilterType, hz: number, q?: number): BiquadFilterNode {
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    if (q !== undefined) filter.Q.value = q;
    return filter;
  }

  private panner(pan: number): StereoPannerNode {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(this.out);
    return panner;
  }
}
