import { Material, Matrix4 } from 'three'
import * as TSL from 'three/tsl'
import type { PanelMaterialInfo } from './create.js'

const {
  Fn,
  float,
  int,
  vec2,
  vec3,
  vec4,
  mat4,
  uv,
  attribute,
  uniform,
  fwidth,
  smoothstep,
  positionLocal,
  min,
  max,
  abs,
  distance,
  dot,
  step,
  mix,
  If,
  mod,
} = TSL

const min4 = (v: any) => min(min(v.x, v.y), min(v.z, v.w))
const max4 = (v: any) => max(max(v.x, v.y), max(v.z, v.w))

const radiusDistance = (radius: any, outside: any, border: any, borderSize: any) => {
  const outerRadius = vec2(radius)
  const innerRadius = outerRadius.sub(borderSize)
  const radiusWeightUnnorm = abs(innerRadius.sub(border))
  const sum = radiusWeightUnnorm.x.add(radiusWeightUnnorm.y)
  const radiusWeight = sum.greaterThan(0.0).select(radiusWeightUnnorm.div(max(sum, float(0.0001))), vec2(0.5))
  return vec2(
    float(radius).sub(distance(outside, outerRadius)),
    dot(radiusWeight, innerRadius).sub(distance(border, innerRadius)),
  )
}

const calculateCornerIntersection = (cornerRadius: any, borderSizes: any, aspectRatio: any) => {
  const safeAspect = max(aspectRatio, float(0.0001))
  const tmp1 = float(cornerRadius).sub(borderSizes.y)
  const xIntersection = vec2(tmp1, tmp1.div(safeAspect))
  const tmp2 = float(cornerRadius).sub(borderSizes.x)
  const yIntersection = vec2(tmp2.mul(safeAspect), tmp2)
  return min(xIntersection, yIntersection)
}

export function createPanelTSLNode({
  instanced,
  diffuseColor,
  dataNode,
}: {
  instanced: boolean
  diffuseColor?: any
  dataNode?: any
}) {
  return Fn(() => {
    const data0 = instanced ? attribute('aData0', 'vec4') : dataNode ? dataNode.element(0) : attribute('aData0', 'vec4')
    const data1 = instanced ? attribute('aData1', 'vec4') : dataNode ? dataNode.element(1) : attribute('aData1', 'vec4')
    const data2 = instanced ? attribute('aData2', 'vec4') : dataNode ? dataNode.element(2) : attribute('aData2', 'vec4')
    const data3 = instanced ? attribute('aData3', 'vec4') : dataNode ? dataNode.element(3) : attribute('aData3', 'vec4')

    const clip0 = attribute('aClipping0', 'vec4')
    const clip1 = attribute('aClipping1', 'vec4')
    const clip2 = attribute('aClipping2', 'vec4')
    const clip3 = attribute('aClipping3', 'vec4')
    const clippingPlanes = [clip0, clip1, clip2, clip3]

    const packed = int(data2.x)
    const r0 = float(mod(packed.div(125000), int(50))).mul(0.01)
    const r1 = float(mod(packed.div(2500), int(50))).mul(0.01)
    const r2 = float(mod(packed.div(50), int(50))).mul(0.01)
    const r3 = float(mod(packed, int(50))).mul(0.01)
    const borderRadius = vec4(r0, r1, r2, r3)

    const clipOpacity = float(1.0).toVar()
    if (instanced) {
      const localPos = positionLocal
      for (let i = 0; i < 4; i++) {
        const plane = clippingPlanes[i]!
        const validPlane = plane.w.lessThan(1e10)
        const distanceToPlane = dot(localPos, plane.xyz).add(plane.w)
        const planeDistanceGradient = max(fwidth(distanceToPlane).mul(0.5), float(0.00001))
        const stepVal = smoothstep(planeDistanceGradient.negate(), planeDistanceGradient, distanceToPlane)
        clipOpacity.mulAssign(validPlane.select(stepVal, float(1.0)))
      }
    }

    const absoluteBorderSize = data0
    const backgroundColor = data1.xyz
    const backgroundOpacity = data1.w
    const borderColor = data2.yzw
    const borderOpacity = data3.x
    const dimensions = data3.zw

    const aspectRatio = max(dimensions.x, float(0.0001)).div(max(dimensions.y, float(0.0001)))
    const borderSize = absoluteBorderSize.div(max(dimensions.yyyy, vec4(0.0001)))

    const uvFlipped = vec2(uv().x, float(1.0).sub(uv().y))
    const v_outsideDistance = vec4(
      uvFlipped.y,
      float(1.0).sub(uvFlipped.x).mul(aspectRatio),
      float(1.0).sub(uvFlipped.y),
      uvFlipped.x.mul(aspectRatio),
    )
    const v_borderDistance = v_outsideDistance.sub(borderSize)

    const dist = vec2(min4(v_outsideDistance), min4(v_borderDistance)).toVar()

    const negateBorderDistance = vec4(1.0).sub(v_borderDistance)
    const maxWeight = max4(negateBorderDistance)
    const borderWeight = step(maxWeight, negateBorderDistance).toVar()
    const insideBorder = vec4(0.0).toVar()

    If(v_outsideDistance.w.lessThan(borderRadius.x).and(v_outsideDistance.x.lessThan(borderRadius.x)), () => {
      const cornerPos = v_outsideDistance.wx
      const cornerRadius = borderRadius.x
      const cornerBorderSizes = borderSize.wx
      dist.assign(radiusDistance(cornerRadius, cornerPos, v_borderDistance.wx, cornerBorderSizes))
      const lineIntersection = calculateCornerIntersection(cornerRadius, cornerBorderSizes, aspectRatio)
      insideBorder.wx.assign(max(vec2(0.0), lineIntersection.sub(v_borderDistance.wx)))
    })
      .ElseIf(v_outsideDistance.y.lessThan(borderRadius.y).and(v_outsideDistance.x.lessThan(borderRadius.y)), () => {
        const cornerPos = v_outsideDistance.yx
        const cornerRadius = borderRadius.y
        const cornerBorderSizes = borderSize.yx
        dist.assign(radiusDistance(cornerRadius, cornerPos, v_borderDistance.yx, cornerBorderSizes))
        const lineIntersection = calculateCornerIntersection(cornerRadius, cornerBorderSizes, aspectRatio)
        insideBorder.yx.assign(max(vec2(0.0), lineIntersection.sub(v_borderDistance.yx)))
      })
      .ElseIf(v_outsideDistance.y.lessThan(borderRadius.z).and(v_outsideDistance.z.lessThan(borderRadius.z)), () => {
        const cornerPos = v_outsideDistance.yz
        const cornerRadius = borderRadius.z
        const cornerBorderSizes = borderSize.yz
        dist.assign(radiusDistance(cornerRadius, cornerPos, v_borderDistance.yz, cornerBorderSizes))
        const lineIntersection = calculateCornerIntersection(cornerRadius, cornerBorderSizes, aspectRatio)
        insideBorder.yz.assign(max(vec2(0.0), lineIntersection.sub(v_borderDistance.yz)))
      })
      .ElseIf(v_outsideDistance.z.lessThan(borderRadius.w).and(v_outsideDistance.w.lessThan(borderRadius.w)), () => {
        const cornerPos = v_outsideDistance.zw
        const cornerRadius = borderRadius.w
        const cornerBorderSizes = borderSize.zw
        dist.assign(radiusDistance(cornerRadius, cornerPos, v_borderDistance.zw, cornerBorderSizes))
        const lineIntersection = calculateCornerIntersection(cornerRadius, cornerBorderSizes, aspectRatio)
        insideBorder.zw.assign(max(vec2(0.0), lineIntersection.sub(v_borderDistance.zw)))
      })

    const insideBorderSum = dot(insideBorder, vec4(1.0))
    If(insideBorderSum.greaterThan(0.0), () => {
      borderWeight.assign(insideBorder.div(max(insideBorderSum, float(0.0001))))
    })

    const distanceGradient = fwidth(dist)
    const outer = smoothstep(distanceGradient.x.negate(), distanceGradient.x, dist.x)
    const inner = smoothstep(distanceGradient.y.negate(), distanceGradient.y, dist.y)

    const transition = float(1.0).sub(step(0.1, outer.sub(inner)).mul(float(1.0).sub(inner)))

    const diffuseAlpha = diffuseColor ? (diffuseColor.a ?? float(1.0)) : float(1.0)
    const fullBackgroundOpacity = diffuseAlpha.mul(backgroundOpacity)
    const fullBorderOpacity = min(float(1.0), borderOpacity.add(fullBackgroundOpacity))

    const outOpacity = (instanced ? clipOpacity.mul(outer) : outer).mul(
      mix(fullBorderOpacity, fullBackgroundOpacity, transition),
    )

    const diffuseRgb = diffuseColor ? (diffuseColor.rgb ?? diffuseColor) : undefined
    const mainColor = diffuseRgb ? diffuseRgb : backgroundColor
    const borderMix = borderOpacity.div(max(fullBorderOpacity, float(0.001)))
    const finalRgb = mix(mix(mainColor, borderColor, borderMix), mainColor, transition)

    return vec4(finalRgb, outOpacity)
  })
}

export function applyPanelMaterialTSL(material: Material, info: PanelMaterialInfo) {
  const instanced = info.type === 'instanced'
  const dataMatrix = info.type === 'normal' ? (info.data instanceof Matrix4 ? info.data : new Matrix4().fromArray(info.data)) : undefined
  const dataNode = info.type === 'normal' ? uniform((material as any).dataUniform || dataMatrix) : undefined
  const mapTexture = (material as any).map ? TSL.texture((material as any).map) : undefined
  let customGradient: any
  const cacheKey = (material as any).customProgramCacheKey?.()
  if (cacheKey === 'DarkBackgroundMaterial-uvGradient-v1') {
    customGradient = TSL.mix(TSL.color(0x272727), TSL.color(0x414141), TSL.uv().y)
  } else if (cacheKey === 'LightBackgroundMaterial-uvGradient-v1') {
    customGradient = TSL.mix(TSL.color(0xf2f2f2), TSL.color(0xffffff), TSL.uv().y)
  }
  const diffuseColor = (material as any).colorNode || customGradient || mapTexture || undefined
  const panelTSL = createPanelTSLNode({ instanced, dataNode, diffuseColor })
  const res = panelTSL()
  material.transparent = true
  ;(material as any).colorNode = res.rgb
  ;(material as any).opacityNode = res.a
}
