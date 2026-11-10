import Phaser from 'phaser';
import { GRAIN_BOIL_MS, type GrainLook } from '@/config';
import { prefersReducedMotion } from '@/scenes/ui';

// Grain is a style added to single elements (M10), not a layer over the scene:
// a filter that darkens or lightens a few of the element's own pixels, so each
// element gets grain in its own colors, and only where it is drawn. Specks are
// hashed from their pixel in the filter's frame, so no texture is stored. A
// Graphics has no size, so its frame is the screen; a Shape, or a Container
// given a size with setSize(), is its own frame, so its grain moves and scales
// with it.

const NODE = 'FilterGrain';
// Seeds are offsets into the hash's input; any spread this wide looks random.
const SEED_RANGE = 1000;

// Darkening multiplies the color and lightening moves it toward its own alpha,
// so both keep the hue and work on premultiplied colors, and transparent
// pixels stay transparent.
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
uniform vec2 share;
uniform vec2 strength;
varying vec2 outTexCoord;

float hash(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main()
{
    vec4 color = texture2D(uMainSampler, outTexCoord);
    vec2 speck = floor(gl_FragCoord.xy / cell) + vec2(seed, seed * 0.618);
    float kind = hash(speck);
    float amount = hash(speck + 57.3);
    if (kind < share.x)
    {
        color.rgb *= 1.0 - strength.x * amount;
    }
    else if (kind > 1.0 - share.y)
    {
        color.rgb += (color.a - color.rgb) * strength.y * amount;
    }
    gl_FragColor = color;
}
`;

class Grain extends Phaser.Filters.Controller {
  seed = Math.random() * SEED_RANGE;

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
    const { cell, dark, light, darken, lighten } = controller.look;
    this.programManager.setUniform('cell', cell);
    this.programManager.setUniform('seed', controller.seed);
    this.programManager.setUniform('share', [dark, light]);
    this.programManager.setUniform('strength', [darken, lighten]);
  }
}

// Once per game, before any scene adds grain (BootScene). Filters are WebGL
// only; under another renderer the game simply has no grain.
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
