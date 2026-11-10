import Phaser from 'phaser';
import { GRAIN_BOIL_MS, type GrainLook } from '@/config';
import { prefersReducedMotion } from '@/scenes/ui';

// Texture is a style added to single elements (M10), not a layer over the
// scene: a filter that shifts the element's own pixels a little darker or
// lighter, so each element gets texture in its own colors, and only where it
// is drawn. Two layers: a soft, blotchy paper mottle that stays put, and a
// fine grain that boils. Both are hashed from the pixel's place in the
// filter's frame, so no texture is stored. A Graphics has no size, so its
// frame is the screen; a Shape, or a Container given a size with setSize(), is
// its own frame, so its texture moves and scales with it.

const NODE = 'FilterGrain';
// Seeds are offsets into the hash's input; any spread this wide looks random.
const SEED_RANGE = 1000;

// shade() darkens by multiplying and lightens by moving toward the pixel's own
// alpha, so both keep the hue and work on premultiplied colors, and
// transparent pixels stay transparent.
const FRAGMENT = `
#pragma phaserTemplate(shaderName)
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMainSampler;
uniform float cell;
uniform float seed;
uniform float mottleSeed;
uniform vec2 strength;
uniform float mottle;
uniform float mottleSize;
varying vec2 outTexCoord;

float hash(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 shade(vec4 color, float shift)
{
    return shift < 0.0 ? color.rgb * (1.0 + shift) : color.rgb + (color.a - color.rgb) * shift;
}

void main()
{
    vec4 color = texture2D(uMainSampler, outTexCoord);
    vec2 q = gl_FragCoord.xy / mottleSize + mottleSeed;
    float blotch = noise(q) * 0.65 + noise(q * 2.7 + 13.1) * 0.35;
    color.rgb = shade(color, (blotch - 0.5) * 2.0 * mottle);
    float grain = hash(floor(gl_FragCoord.xy / cell) + vec2(seed, seed * 0.618)) * 2.0 - 1.0;
    color.rgb = shade(color, grain < 0.0 ? grain * strength.x : grain * strength.y);
    gl_FragColor = color;
}
`;

class Grain extends Phaser.Filters.Controller {
  seed = Math.random() * SEED_RANGE;
  readonly mottleSeed = Math.random() * SEED_RANGE;

  constructor(
    camera: Phaser.Cameras.Scene2D.Camera,
    readonly look: GrainLook,
  ) {
    super(camera, NODE);
  }
}

class GrainNode extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
  constructor(manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
    super(NODE, manager, undefined, FRAGMENT);
  }

  override setupUniforms(controller: Phaser.Filters.Controller): void {
    if (!(controller instanceof Grain)) return;
    const { cell, darken, lighten, mottle, mottleSize } = controller.look;
    this.programManager.setUniform('cell', cell);
    this.programManager.setUniform('seed', controller.seed);
    this.programManager.setUniform('mottleSeed', controller.mottleSeed);
    this.programManager.setUniform('strength', [darken, lighten]);
    this.programManager.setUniform('mottle', mottle);
    this.programManager.setUniform('mottleSize', mottleSize);
  }
}

// Once per game, before any scene adds texture (BootScene). Filters are WebGL
// only; under another renderer the game simply has none.
export function registerGrain(renderer: Phaser.Renderer.Canvas.CanvasRenderer | Phaser.Renderer.WebGL.WebGLRenderer): void {
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  if (!renderer.renderNodes.hasNode(NODE)) renderer.renderNodes.addNodeConstructor(NODE, GrainNode);
}

export function addGrain(target: Phaser.GameObjects.GameObject, look: GrainLook): void {
  const filters = target.enableFilters().filters;
  if (filters === null) return;
  const grain = new Grain(filters.internal.camera, look);
  filters.internal.add(grain);
  if (prefersReducedMotion()) return;
  target.scene.time.addEvent({
    delay: GRAIN_BOIL_MS,
    loop: true,
    callback: () => {
      grain.seed = Math.random() * SEED_RANGE;
    },
  });
}
