import { Group, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'
import { ClippingRect, createGlobalClippingPlanes } from '../src/clipping.js'
import { Container, Content, Image } from '../src/index.js'
import { applyClippingMaterialTSL, applyPanelMaterialTSL, enableWebGPU } from '../src/webgpu/index.js'
import { expect } from 'chai'

const defaultPlaneNormals = [new Vector3(0, -1, 0), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 0, 0)]

function expectClippingCenterAndSize(
  clippingRect: ClippingRect,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): void {
  for (let i = 0; i < 4; i++) {
    expect(clippingRect.planes[i].normal.distanceTo(defaultPlaneNormals[i])).to.be.lessThan(0.01)
  }
  const maxY = clippingRect.planes[0].constant
  const maxX = clippingRect.planes[1].constant
  const minY = -clippingRect.planes[2].constant
  const minX = -clippingRect.planes[3].constant
  const actualCenterX = (maxX + minX) * 0.5
  const actualCenterY = (maxY + minY) * 0.5
  const actualWidth = maxX - minX
  const actualHeight = maxY - minY
  expect(actualCenterX).to.be.closeTo(centerX, 0.01)
  expect(actualCenterY).to.be.closeTo(centerY, 0.01)
  expect(actualWidth).to.be.closeTo(width, 0.01)
  expect(actualHeight).to.be.closeTo(height, 0.01)
}

describe('clipping', () => {
  it('should setup planes', () => {
    const rect1 = new ClippingRect(new Matrix4().makeTranslation(new Vector3(44, 55, 0)), 0, 0, 10, 22)
    expectClippingCenterAndSize(rect1, 44, 55, 10, 22)
  })

  it('should intersect of 2 translated clips', () => {
    const rect1 = new ClippingRect(new Matrix4().makeTranslation(new Vector3(0, 0, 0)), 0, 0, 2, 1)
    const rect2 = new ClippingRect(new Matrix4().makeTranslation(new Vector3(0.5, -1, 0)), 0, 0, 1, 2)
    rect1.min(rect2)
    expectClippingCenterAndSize(rect1, 0.5, -0.25, 1, 0.5)
  })

  it('should intersect of 2 translated clips (inverted min call)', () => {
    const rect1 = new ClippingRect(new Matrix4().makeTranslation(new Vector3(0, 0, 0)), 0, 0, 2, 1)
    const rect2 = new ClippingRect(new Matrix4().makeTranslation(new Vector3(0.5, -1, 0)), 0, 0, 1, 2)
    rect2.min(rect1)
    expectClippingCenterAndSize(rect2, 0.5, -0.25, 1, 0.5)
  })

  it('should intersect intersect clip with clip rotated on x-axis', () => {
    const rect1 = new ClippingRect(new Matrix4(), 0, 0, 1, 1)
    const rect2 = new ClippingRect(new Matrix4().makeRotationY((65 / 180) * Math.PI), 0, 0, 0.5, 1)
    rect1.min(rect2)
    expectClippingCenterAndSize(rect1, 0, 0, 1, 1)
  })

  it('should sync world-space clippingPlanes into TSL uniforms for non-instanced panels (Image)', () => {
    enableWebGPU()
    const scene = new Group()
    const root = new Container({ width: 100, height: 60, overflow: 'hidden', pixelSize: 1 })
    const image = new Image({ width: 200, height: 200 }, undefined, { loadTexture: false })
    root.add(image)
    scene.add(root)
    scene.updateMatrixWorld(true)
    root.update(0)

    const mat = image.material as any
    expect(mat.__tslPanelApplied).to.equal(true)
    expect(mat.clipPlanesUniforms).to.be.an('array').with.lengthOf(4)

    for (let i = 0; i < 4; i++) {
      mat.clipPlanesUniforms[i].update({ material: image.material })
    }

    // Verify all 4 planes have distinct normals (no shared RelativePlane normal clobbering)
    expect(mat.clipPlanesUniforms[0].value.toArray()).to.deep.equal([0, -1, 0, 30])
    expect(mat.clipPlanesUniforms[1].value.toArray()).to.deep.equal([-1, 0, 0, 50])
    expect(mat.clipPlanesUniforms[2].value.toArray()).to.deep.equal([0, 1, 0, 30])
    expect(mat.clipPlanesUniforms[3].value.toArray()).to.deep.equal([1, 0, 0, 50])
  })

  it('should default TSL clip plane uniforms to (0, 0, 0, 1) when material has no clippingPlanes', () => {
    const material = new MeshBasicMaterial()
    applyPanelMaterialTSL(material, { type: 'normal', data: new Float32Array(16) })
    const mat = material as any
    expect(mat.clipPlanesUniforms).to.be.an('array').with.lengthOf(4)
    for (let i = 0; i < 4; i++) {
      mat.clipPlanesUniforms[i].update({ material })
      expect(mat.clipPlanesUniforms[i].value.toArray()).to.deep.equal([0, 0, 0, 1])
    }
  })

  it('should apply TSL world-space clipping planes to Content child meshes in WebGPU mode', () => {
    enableWebGPU()
    const scene = new Group()
    const root = new Container({ width: 80, height: 40, overflow: 'hidden', pixelSize: 1 })
    const content = new Content({ width: 80, height: 40 })
    const childMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    const childMesh = new Mesh(new PlaneGeometry(10, 10), childMaterial)
    content.add(childMesh)
    root.add(content)
    scene.add(root)
    scene.updateMatrixWorld(true)
    root.update(0)
    content.notifyAncestorsChanged()

    const mat = childMaterial as any
    expect(mat.__tslClippingApplied).to.equal(true)
    expect(mat.opacityNode).to.not.equal(null)
    expect(mat.clipPlanesUniforms).to.be.an('array').with.lengthOf(4)

    for (let i = 0; i < 4; i++) {
      mat.clipPlanesUniforms[i].update({ material: childMaterial })
    }
    expect(mat.clipPlanesUniforms[0].value.toArray()).to.deep.equal([0, -1, 0, 20])
    expect(mat.clipPlanesUniforms[1].value.toArray()).to.deep.equal([-1, 0, 0, 40])
    expect(mat.clipPlanesUniforms[2].value.toArray()).to.deep.equal([0, 1, 0, 20])
    expect(mat.clipPlanesUniforms[3].value.toArray()).to.deep.equal([1, 0, 0, 40])

    // Calling applyClippingMaterialTSL again is idempotent
    const prevOpacityNode = mat.opacityNode
    applyClippingMaterialTSL(childMaterial)
    expect(mat.opacityNode).to.equal(prevOpacityNode)
    expect(createGlobalClippingPlanes(content)).to.have.lengthOf(4)
  })
})
