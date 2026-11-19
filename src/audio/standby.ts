import { Music } from '@/audio/Music';
import { AUDIO } from '@/config';
import { midiHz } from '@/logic/sound-levels';
import { standbyBeat, standbyLoopSeconds, standbyNotes, type Bell, type Swell } from '@/logic/standby-schedule';

const SILENT = 0.0001; // exponential ramps can't reach 0
const STOP_MARGIN = 0.05; // s a source runs past its envelope, so it never clicks off
const DOWN_60_DB = Math.log(1000); // the reverb's noise fades this many e-folds: to -60 dB

let rendered: Promise<AudioBuffer | null> | null = null;
let menuMusic: Music | null = null;

// Standby, the title and tutorial music (AUDIO.standby), rendered once in
// the background into a buffer one loop long: Boot starts it, so the title
// rarely waits. Null when the browser can't render it; the menus are then
// silent.
export function loadStandby(ctx: BaseAudioContext): Promise<AudioBuffer | null> {
  rendered ??= renderStandby(ctx.sampleRate).catch(() => null);
  return rendered;
}

// The title starts it, it carries on through the tutorial, and the first
// wall stops it. Like all the music, it waits for the first click to unlock
// audio.
export function startMenuMusic(ctx: BaseAudioContext, destination: AudioNode): void {
  if (menuMusic !== null) return;
  const { gain, fadeInMs } = AUDIO.standby;
  menuMusic = new Music(ctx, destination, { gain, fadeInMs }, loadStandby);
  menuMusic.start();
}

export function stopMenuMusic(): void {
  menuMusic?.stop();
  menuMusic = null;
}

// Three loops' notes over two loops' time, keeping the second: its start
// carries the first loop's tails (the reverb, the echoes, the last chord
// fading) and its end the third loop's lead-in, so it loops seamlessly.
async function renderStandby(sampleRate: number): Promise<AudioBuffer> {
  const frames = Math.round(standbyLoopSeconds() * sampleRate);
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: frames * 2, sampleRate });
  const mix = new StandbyMix(ctx);
  const notes = standbyNotes(3);
  // Only the first chord's swells lead in from before 0, which Web Audio
  // can't schedule; they are over long before the loop the render keeps.
  const started = (note: Swell) => note.from >= 0;
  notes.pads.filter(started).forEach((note) => mix.pad(note));
  notes.bass.filter(started).forEach((note) => mix.bass(note));
  notes.bells.forEach((note) => mix.bell(note));
  const both = await ctx.startRendering();
  const loop = new AudioBuffer({ numberOfChannels: 2, length: frames, sampleRate });
  for (let channel = 0; channel < 2; channel++) loop.copyToChannel(both.getChannelData(channel).subarray(frames), channel);
  return loop;
}

// Standby's mixer: a bus per pan position, each sending to the echo and the
// reverb as AUDIO.standby says.
class StandbyMix {
  private readonly reverb: GainNode;
  private readonly echo: GainNode;
  private readonly padBuses = new Map<number, AudioNode>();
  private readonly bassBus: GainNode;
  private readonly bellBuses = new Map<number, AudioNode>();

  constructor(private readonly ctx: OfflineAudioContext) {
    const { pad, bass, bells, echo, reverb } = AUDIO.standby;
    const out = ctx.destination;

    this.reverb = this.gain(1);
    const convolver = ctx.createConvolver();
    convolver.normalize = false;
    const { ir, energy } = this.decayingNoise(reverb.seconds);
    convolver.buffer = ir;
    this.reverb.connect(convolver).connect(this.gain(reverb.wet / Math.sqrt(energy))).connect(out);

    // The echo loops through its delay, and only the repeats come out.
    this.echo = this.gain(1);
    const delay = ctx.createDelay(echo.beats * standbyBeat() + STOP_MARGIN);
    delay.delayTime.value = echo.beats * standbyBeat();
    const repeats = this.gain(echo.feedback);
    this.echo.connect(delay).connect(repeats).connect(this.echo);
    repeats.connect(out);
    repeats.connect(this.gain(echo.reverb)).connect(this.reverb);

    // The pad's lowpass breathes, on a slow sine from time 0, so the kept
    // loop starts and ends on the same breath.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = pad.cutoffHz;
    const breath = ctx.createOscillator();
    breath.frequency.value = 1 / (pad.breatheBars * 4 * standbyBeat());
    breath.connect(this.gain(pad.breatheHz)).connect(lowpass.frequency);
    breath.start(0);
    const padLevel = this.gain(pad.level);
    padLevel.connect(lowpass).connect(out);
    lowpass.connect(this.gain(pad.reverb)).connect(this.reverb);
    for (const pan of pad.pans) this.padBuses.set(pan, this.panner(pan, padLevel));

    this.bassBus = this.gain(bass.level);
    this.bassBus.connect(out);

    for (const pan of [-bells.pan, bells.pan]) {
      const panner = this.panner(pan, out);
      panner.connect(this.gain(bells.reverb)).connect(this.reverb);
      panner.connect(this.gain(bells.echo)).connect(this.echo);
      const level = this.gain(bells.level);
      level.connect(panner);
      this.bellBuses.set(pan, level);
    }
  }

  // A chord note: detuned saws, averaged, swelling in and out.
  pad(note: Swell): void {
    const { detuneCents } = AUDIO.standby.pad;
    const bus = this.padBuses.get(note.pan);
    if (bus === undefined) return;
    const swell = this.swell(note, 1 / detuneCents.length, bus);
    for (const cents of detuneCents) {
      const saw = this.ctx.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = midiHz(note.midi);
      saw.detune.value = cents;
      this.play(saw, note.from, note.to).connect(swell);
    }
  }

  // A bass note: a sine with a little of its octave.
  bass(note: Swell): void {
    const swell = this.swell(note, 1, this.bassBus);
    this.sine(midiHz(note.midi), note.from, note.to).connect(swell);
    this.sine(midiHz(note.midi) * 2, note.from, note.to).connect(this.gain(AUDIO.standby.bass.octaveLevel)).connect(swell);
  }

  // A glassy bell: sine partials, struck, dying away.
  bell(note: Bell): void {
    const { partials, attackMs, decayMs } = AUDIO.standby.bells;
    const bus = this.bellBuses.get(note.pan);
    if (bus === undefined) return;
    const end = note.at + decayMs / 1000;
    const strike = this.gain(SILENT);
    strike.gain.setValueAtTime(SILENT, note.at);
    strike.gain.exponentialRampToValueAtTime(1, note.at + attackMs / 1000);
    strike.gain.exponentialRampToValueAtTime(SILENT, end);
    strike.connect(bus);
    for (const [ratio, level] of partials) {
      this.sine(midiHz(note.midi) * ratio, note.at, end).connect(this.gain(level)).connect(strike);
    }
  }

  private swell(note: Swell, peak: number, to: AudioNode): GainNode {
    const swell = this.gain(0);
    swell.gain.setValueAtTime(0, note.from);
    swell.gain.linearRampToValueAtTime(peak, note.peak);
    swell.gain.setValueAtTime(peak, note.holdUntil);
    swell.gain.linearRampToValueAtTime(0, note.to);
    swell.connect(to);
    return swell;
  }

  private sine(hz: number, from: number, to: number): OscillatorNode {
    const osc = this.ctx.createOscillator();
    osc.frequency.value = hz;
    return this.play(osc, from, to);
  }

  private play(osc: OscillatorNode, from: number, to: number): OscillatorNode {
    osc.start(from);
    osc.stop(to + STOP_MARGIN);
    return osc;
  }

  private gain(value: number): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.value = value;
    return gain;
  }

  private panner(pan: number, to: AudioNode): StereoPannerNode {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(to);
    return panner;
  }

  // A stereo impulse of noise dying away to -60 dB over `seconds`, a
  // different noise in each ear, and its energy (the mean of the two), which
  // sets the reverb's level.
  private decayingNoise(seconds: number): { ir: AudioBuffer; energy: number } {
    const length = Math.ceil(seconds * this.ctx.sampleRate);
    const ir = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    let energy = 0;
    for (let channel = 0; channel < 2; channel++) {
      const data = ir.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp((-DOWN_60_DB * i) / length);
        energy += (data[i] ?? 0) ** 2 / 2;
      }
    }
    return { ir, energy };
  }
}
