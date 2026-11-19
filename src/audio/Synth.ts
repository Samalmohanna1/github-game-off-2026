import { AUDIO } from '@/config';
import { clickHz, fanfareHz, noteHz, whompHz } from '@/logic/sound-levels';

const SILENT = 0.0001; // exponential ramps can't reach 0
const STOP_MARGIN = 0.05; // s a source runs past its envelope, so it never clicks off
const PULSE_HARMONICS = 32; // the browser band-limits the wave; more adds nothing audible
const sec = (ms: number) => ms / 1000;

type Wave = Exclude<OscillatorType, 'custom'> | 'pulse';

// White noise. Given heldHz, each value is held so it changes only heldHz
// times a second: a crunchy 8-bit noise.
function noiseBuffer(ctx: BaseAudioContext, seconds: number, heldHz?: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const hold = heldHz === undefined ? 1 : Math.max(1, Math.round(ctx.sampleRate / heldHz));
  for (let i = 0; i < data.length; i++) data[i] = i % hold === 0 ? Math.random() * 2 - 1 : data[i - 1]!;
  return buffer;
}

// A pulse wave high for `duty` of each cycle, from its Fourier series. Web
// Audio's oscillators only offer the 50% square.
function pulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  const real = new Float32Array(PULSE_HARMONICS + 1);
  const imag = new Float32Array(PULSE_HARMONICS + 1);
  for (let n = 1; n <= PULSE_HARMONICS; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

// Every sound effect, synthesized with Web Audio (PLAN.md §10, M9); the music
// is the one sound file (Music.ts). Sounds are skipped unless the context is
// running, so nothing queues up before the browser unlocks audio on the first
// click, or plays while the window is blurred. Plain Web Audio, no Phaser:
// the scene hands in Phaser's context and master node, so Phaser's mute and
// volume still apply.
export class Synth {
  private readonly out: GainNode;
  private readonly noise: AudioBuffer;
  private readonly crunch: AudioBuffer;
  private readonly pulse: PeriodicWave;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = AUDIO.master;
    this.out.connect(destination);
    this.noise = noiseBuffer(ctx, 1);
    this.crunch = noiseBuffer(ctx, 1, AUDIO.hit.smackCrushHz);
    this.pulse = pulseWave(ctx, AUDIO.pulseDuty);
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
    const { gain, wave, ms } = AUDIO.click;
    const at = this.ctx.currentTime;
    const hz = clickHz(heldCount);
    this.tone(wave, hz, at, ms).connect(this.filter('lowpass', hz * 6)).connect(this.envelope(gain, 2, ms, at));
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
    const { gain, wave, noteMs, lastMs } = AUDIO.fanfare;
    const notes = fanfareHz();
    const start = this.ctx.currentTime;
    notes.forEach((hz, i) => {
      const at = start + sec(i * noteMs);
      const ms = i === notes.length - 1 ? lastMs : noteMs;
      this.tone(wave, hz, at, ms).connect(this.filter('lowpass', hz * 6)).connect(this.envelope(gain, 5, ms, at));
    });
  }

  // The count into the first wall: a beep on 3, 2 and 1, and a higher, longer
  // one as the wall appears (go).
  readyBeep(go: boolean): void {
    if (!this.running) return;
    const { gain, wave, hz, ms, goHz, goMs } = AUDIO.ready;
    const [pitch, length] = go ? [goHz, goMs] : [hz, ms];
    const at = this.ctx.currentTime;
    this.tone(wave, pitch, at, length).connect(this.filter('lowpass', pitch * 6)).connect(this.envelope(gain, 3, length, at));
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
    this.noiseBurst(this.noise, at, ms).connect(band).connect(this.envelope(gain, ms / 2, ms, at, this.panner(dir * pan)));
  }

  // The wall hits the figure: a low chip thump under a crunchy 8-bit smack,
  // with no lead-in.
  hit(): void {
    if (!this.running) return;
    const { gain, wave, fromHz, toHz, ms, smackGain, smackMs } = AUDIO.hit;
    const at = this.ctx.currentTime;
    const thump = this.tone(wave, fromHz, at, ms);
    thump.frequency.exponentialRampToValueAtTime(toHz, at + sec(ms));
    thump.connect(this.envelope(gain, 2, ms, at));
    this.noiseBurst(this.crunch, at, smackMs).connect(this.envelope(smackGain, 1, smackMs, at));
  }

  // The figure lands: "whomp whomp whooom", stepping down the music's key.
  // Each note plays on the pulse wave, with the triangle an octave under it.
  whomp(): void {
    if (!this.running) return;
    const w = AUDIO.whomp;
    const notes = whompHz();
    const start = this.ctx.currentTime;
    notes.forEach((hz, i) => {
      const last = i === notes.length - 1;
      const at = start + sec(i * w.gapMs);
      const ms = last ? w.lastMs : w.noteMs;
      this.whompNote(w.wave, hz, at, ms, last)
        .connect(this.filter('lowpass', hz * 6))
        .connect(this.heldEnvelope(w.gain, 10, ms * w.holdShare, ms, at));
      this.whompNote(w.subWave, hz / 2, at, ms, last).connect(this.heldEnvelope(w.gain, 10, ms * w.holdShare, ms, at));
    });
  }

  // One voice of a whomp note: it bends down into its pitch (the "whomp"),
  // and the last note wobbles and sags.
  private whompNote(wave: Wave, hz: number, at: number, ms: number, last: boolean): OscillatorNode {
    const w = AUDIO.whomp;
    const note = this.tone(wave, noteHz(hz, w.bendSemitones), at, ms);
    note.frequency.exponentialRampToValueAtTime(hz, at + sec(w.bendMs));
    if (last) {
      note.frequency.setValueAtTime(hz, at + sec(ms * w.holdShare));
      note.frequency.exponentialRampToValueAtTime(noteHz(hz, -w.sagSemitones), at + sec(ms));
      this.wobble(note, w.vibratoHz, hz * w.vibratoDepth, at, ms);
    }
    return note;
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

  // Like envelope(), but sustains `peak` until holdMs before fading.
  private heldEnvelope(peak: number, attackMs: number, holdMs: number, endMs: number, at: number): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(SILENT, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + sec(attackMs));
    gain.gain.setValueAtTime(peak, at + sec(holdMs));
    gain.gain.exponentialRampToValueAtTime(SILENT, at + sec(endMs));
    gain.connect(this.out);
    return gain;
  }

  private tone(wave: Wave, hz: number, at: number, ms: number): OscillatorNode {
    const osc = this.ctx.createOscillator();
    if (wave === 'pulse') osc.setPeriodicWave(this.pulse);
    else osc.type = wave;
    osc.frequency.setValueAtTime(hz, at);
    osc.start(at);
    osc.stop(at + sec(ms) + STOP_MARGIN);
    return osc;
  }

  private noiseBurst(noise: AudioBuffer, at: number, ms: number): AudioBufferSourceNode {
    const source = this.ctx.createBufferSource();
    source.buffer = noise;
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
