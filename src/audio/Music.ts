import musicUrl from '@/assets/audio/Three Red Hearts - Pixel War 2.ogg';
import { AUDIO } from '@/config';

let track: Promise<AudioBuffer | null> | null = null;

// Fetches and decodes the track once, in the background: Boot starts it, so
// the first run rarely waits for it. Null when the browser can't fetch or
// decode it, and the game then plays without music.
export function loadMusic(ctx: BaseAudioContext): Promise<AudioBuffer | null> {
  track ??= fetch(musicUrl)
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => null);
  return track;
}

// How the track is played: its gain under AUDIO.master, and optionally slower
// (a playback rate, which lowers it too), muffled (a lowpass), with an echo
// (a feedback delay), and fading in.
export interface MusicStyle {
  readonly gain: number;
  readonly rate?: number;
  readonly cutoffHz?: number;
  readonly echo?: { readonly ms: number; readonly feedback: number };
  readonly fadeInMs?: number;
}

// The track looping from the top, in one style: a run's music (AUDIO.music),
// stopped when the player loses, or the game over's (AUDIO.gameOverMusic).
// One per scene, like the Synth, and through the same context and master
// node, so it is silent while the window is blurred and follows Phaser's mute
// and volume. A buffer loop is gapless, and the track is cut to loop.
export class Music {
  private readonly out: GainNode;
  private source: AudioBufferSourceNode | null = null;
  private stopped = false;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
    private readonly style: MusicStyle = AUDIO.music,
  ) {
    this.out = ctx.createGain();
    this.out.connect(destination);
  }

  // Plays as soon as the track has loaded, unless stopped by then.
  start(): void {
    void loadMusic(this.ctx).then((buffer) => {
      if (buffer === null || this.stopped) return;
      const { gain, rate = 1, cutoffHz, echo, fadeInMs = 0 } = this.style;
      const at = this.ctx.currentTime;
      const level = AUDIO.master * gain;
      this.out.gain.setValueAtTime(fadeInMs > 0 ? 0 : level, at);
      if (fadeInMs > 0) this.out.gain.linearRampToValueAtTime(level, at + fadeInMs / 1000);

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = rate;
      let tail: AudioNode = source;
      if (cutoffHz !== undefined) {
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = cutoffHz;
        tail = tail.connect(lowpass);
      }
      if (echo !== undefined) tail = tail.connect(this.echo(echo.ms, echo.feedback));
      tail.connect(this.out);
      // The echo keeps its loop running, so let go of the whole graph once
      // the fade-out is over.
      source.onended = () => this.out.disconnect();
      source.start();
      this.source = source;
    });
  }

  // A quick fade rather than a cut, which would click.
  stop(): void {
    this.stopped = true;
    if (this.source === null) return;
    const at = this.ctx.currentTime;
    const end = at + AUDIO.music.stopMs / 1000;
    this.out.gain.cancelScheduledValues(at);
    this.out.gain.setValueAtTime(this.out.gain.value, at);
    this.out.gain.linearRampToValueAtTime(0, end);
    this.source.stop(end);
    this.source = null;
  }

  // Each repeat comes `ms` after the last at `feedback` of its level.
  private echo(ms: number, feedback: number): GainNode {
    const mix = this.ctx.createGain();
    const delay = this.ctx.createDelay(ms / 1000);
    delay.delayTime.value = ms / 1000;
    const repeat = this.ctx.createGain();
    repeat.gain.value = feedback;
    mix.connect(delay).connect(repeat).connect(mix);
    return mix;
  }
}
