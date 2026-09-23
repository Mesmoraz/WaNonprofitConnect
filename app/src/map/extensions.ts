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
