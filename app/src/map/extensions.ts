import { LayerExtension, type Layer } from '@deck.gl/core'

/*
 * SoftGlowExtension: fades a layer's alpha from its center line (paths) or center (circles) out to
 * the edge, so a wide translucent path under a golden thread reads as a glow and a big circle under
 * a busy pin reads as warmth, not a disc. Pure fragment math on geometry.uv.
 */
const softGlowPath = {
  name: 'softGlowPath',
  inject: {
    'fs:DECKGL_FILTER_COLOR': /* glsl */ `
  float glowF = clamp(1.0 - abs(geometry.uv.x), 0.0, 1.0);
  color.a *= glowF * glowF;
`,
  },
}
const softGlowPoint = {
  name: 'softGlowPoint',
  inject: {
    'fs:DECKGL_FILTER_COLOR': /* glsl */ `
  float glowF = clamp(1.0 - length(geometry.uv), 0.0, 1.0);
  color.a *= glowF * glowF;
`,
  },
}

export class SoftGlowExtension extends LayerExtension<{ shape: 'path' | 'point' }> {
  static extensionName = 'SoftGlowExtension'
  getShaders(this: Layer, extension: SoftGlowExtension) {
    return { modules: [extension.opts.shape === 'path' ? softGlowPath : softGlowPoint] }
  }
}
