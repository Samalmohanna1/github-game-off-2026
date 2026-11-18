import musicUrl from '@/assets/audio/Three Red Hearts - Pixel War 2.ogg';
import { AUDIO } from '@/config';

// The music, the game's one sound file: a single loop under every screen for
// as long as the page is open, never restarting between runs. It loads in the
// background, so the title never waits for it. Like the Synth, it plays
// through Phaser's context and master node, so it starts once the first click
// unlocks audio, stops while the window is blurred, and follows Phaser's mute
// and volume. A buffer loop is gapless, and the track is cut to loop.
export async function playMusic(ctx: BaseAudioContext, destination: AudioNode): Promise<void> {
  let buffer: AudioBuffer;
  try {
    const response = await fetch(musicUrl);
    buffer = await ctx.decodeAudioData(await response.arrayBuffer());
  } catch {
    return; // a browser that can't fetch or decode the track plays without music
  }
  const gain = ctx.createGain();
  gain.gain.value = AUDIO.master * AUDIO.music.gain;
  gain.connect(destination);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  // Before the unlock the context is suspended, so this waits for it.
  source.start();
}
