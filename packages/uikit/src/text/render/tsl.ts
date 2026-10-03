import type { Material } from 'three'
import * as TSL from 'three/tsl'
import type { Font } from '../font.js'

const {
  Fn,
  float,
  vec2,
  vec4,
  uv,
  texture,
  attribute,
  fwidth,
  length,
  smoothstep,
  pow,
  positionLocal,
  min,
  max,
  dot,
} = TSL

export function createGlyphTSLNode(font: Font) {
  return Fn(() => {
    const instanceUVOffset = attribute('instanceUVOffset', 'vec4')
    const instanceRGBA = attribute('instanceRGBA', 'vec4')
    const clip0 = attribute('instanceClipping0', 'vec4')
    const clip1 = attribute('instanceClipping1', 'vec4')
    const clip2 = attribute('instanceClipping2', 'vec4')
    const clip3 = attribute('instanceClipping3', 'vec4')
    const clippingPlanes = [clip0, clip1, clip2, clip3]

    const instanceRenderSolid = attribute('instanceRenderSolid', 'float')

    const fontUv = instanceUVOffset.xy.add(uv().mul(instanceUVOffset.zw))
    const fontTexture = font.page
    const pageSize = vec2(font.pageWidth, font.pageHeight)
    const distanceRange = float(font.distanceRange)

    const msdf = texture(fontTexture, fontUv).rgb
    const median = max(min(msdf.r, msdf.g), min(max(msdf.r, msdf.g), msdf.b))
    const dist = median.sub(0.5).mul(distanceRange)

    const aaDist = length(fwidth(fontUv.mul(pageSize))).mul(0.5).clamp(0.0, distanceRange.mul(0.5))
    const rawAlpha = smoothstep(aaDist.negate(), aaDist, dist)

    const gamma = float(1.3)
    const alpha = instanceRenderSolid.greaterThan(0.5).select(float(1.0), pow(rawAlpha, float(1.0).div(gamma)))

    const localPos = positionLocal
    const clipOpacity = float(1.0).toVar()

    for (let i = 0; i < 4; i++) {
      const plane = clippingPlanes[i]!
      const validPlane = plane.w.lessThan(1e10)
      const distanceToPlane = dot(localPos, plane.xyz).add(plane.w)
      const distanceGradient = max(fwidth(distanceToPlane).mul(0.5), float(0.00001))
      const stepVal = smoothstep(distanceGradient.negate(), distanceGradient, distanceToPlane)
      clipOpacity.mulAssign(validPlane.select(stepVal, float(1.0)))
    }

    const finalAlpha = alpha.mul(clipOpacity).mul(instanceRGBA.a)
    const finalColor = instanceRGBA.rgb

    return vec4(finalColor, finalAlpha)
  })
}

export function applyGlyphMaterialTSL(material: Material, font: Font) {
  const glyphTSL = createGlyphTSLNode(font)
  const res = glyphTSL()
  ;(material as any).colorNode = res.rgb
  ;(material as any).opacityNode = res.a
}