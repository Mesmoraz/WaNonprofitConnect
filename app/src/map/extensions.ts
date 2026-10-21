import { LayerExtension, type Layer } from '@deck.gl/core'

/*
 * FlowExtension: makes PathStyleExtension's dashes drift along the path, start to end.
 *
 * PathStyleExtension (dash: true, dashMode: 'path') already gives continuous dashes along the
 * whole polyline and writes the per-segment phase into the varying `vDashOffset`. We append one
 * line after it in the vertex shader that subtracts a shift (in CSS pixels) from that phase. The
 * shift is a single uniform, so a frame of animation is one float: no attributes are rebuilt.
 *
 * Must be listed AFTER PathStyleExtension, and the layer needs dashUnits: 'pixels'. The injection
 * uses `order: 100` so it lands after the dash code in `vs:#main-end` regardless of module order.
 */
const flowModule = {
  name: 'flow',
  vs: /* glsl */ `layout(std140) uniform flowUniforms { float shift; } flow;`,
  uniformTypes: { shift: 'f32' },
  inject: {
    'vs:#main-end': {
      order: 100,
      injection: /* glsl */ `
#ifdef DASH_ENABLED
  float flowUnitPx = path.billboard ? width.x * project.focalDistance : width.x * project.scale;
  vDashOffset -= flow.shift / max(flowUnitPx, 0.0001);
#endif
`,
    },
  },
}

export type FlowExtensionProps = { flowShift?: number }

export class FlowExtension extends LayerExtension {
  static extensionName = 'FlowExtension'
  static defaultProps = { flowShift: 0 }
  getShaders() { return { modules: [flowModule] } }
  draw(this: Layer<FlowExtensionProps>) {
    this.setShaderModuleProps({ flow: { shift: this.props.flowShift ?? 0 } })
  }
}

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

/*
 * RingExtension: an organization's pin as a ring that says what it has open (S-129). Drawn on a stroked-only
 * ScatterplotLayer. The stroke takes the layer's line color (offers, green); the share of it clockwise from the top
 * given by `getNeedShare` (0 to 1) takes `needColor` instead (needs, amber). Alpha stays the line color's, so dimming
 * still works. Pure fragment math on geometry.uv; one float attribute per pin.
 */
const ringModule = {
  name: 'ring',
  vs: /* glsl */ `layout(std140) uniform ringUniforms { vec4 needColor; } ring;`,
  fs: /* glsl */ `layout(std140) uniform ringUniforms { vec4 needColor; } ring;`,
  uniformTypes: { needColor: 'vec4<f32>' },
  inject: {
    'vs:#decl': /* glsl */ `in float instanceNeedShare;\nout float vNeedShare;`,
    'vs:#main-end': /* glsl */ `vNeedShare = instanceNeedShare;`,
    'fs:#decl': /* glsl */ `in float vNeedShare;`,
    'fs:DECKGL_FILTER_COLOR': /* glsl */ `
  float ringT = fract(atan(geometry.uv.x, geometry.uv.y) / 6.2831853 + 1.0);
  if (ringT < vNeedShare) color.rgb = ring.needColor.rgb;
`,
  },
}

export type RingExtensionProps<D = unknown> = { getNeedShare?: (d: D) => number; needColor?: [number, number, number, number] }

export class RingExtension extends LayerExtension {
  static extensionName = 'RingExtension'
  static defaultProps = { getNeedShare: { type: 'accessor', value: 0 }, needColor: [184, 116, 26, 255] }
  getShaders() { return { modules: [ringModule] } }
  initializeState(this: Layer<RingExtensionProps>) {
    this.getAttributeManager()?.addInstanced({ instanceNeedShare: { size: 1, accessor: 'getNeedShare', defaultValue: 0 } })
  }
  draw(this: Layer<RingExtensionProps>) {
    const c = this.props.needColor ?? [184, 116, 26, 255]
    this.setShaderModuleProps({ ring: { needColor: c.map(v => v / 255) } })
  }
}
