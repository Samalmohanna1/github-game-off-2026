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

// A run's music, the game's one sound file: the track loops from the top
// while the run lasts and stops when the player loses. One per Play scene,
// like the Synth, and through the same context and master node, so it is
// silent while the window is blurred and follows Phaser's mute and volume.
// A buffer loop is gapless, and the track is cut to loop.
export class Music {
  private readonly out: GainNode;
  private source: AudioBufferSourceNode | null = null;
  private stopped = false;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = AUDIO.master * AUDIO.music.gain;
    this.out.connect(destination);
  }

  // Plays as soon as the track has loaded, unless the run is over by then.
  start(): void {
    void loadMusic(this.ctx).then((buffer) => {
      if (buffer === null || this.stopped) return;
      this.source = this.ctx.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      this.source.connect(this.out);
      this.source.start();
    });
  }

  // A quick fade rather than a cut, which would click.
  stop(): void {
    this.stopped = true;
    if (this.source === null) return;
    const at = this.ctx.currentTime;
    const end = at + AUDIO.music.stopMs / 1000;
    this.out.gain.setValueAtTime(this.out.gain.value, at);
    this.out.gain.linearRampToValueAtTime(0, end);
    this.source.stop(end);
    this.source = null;
  }
}
