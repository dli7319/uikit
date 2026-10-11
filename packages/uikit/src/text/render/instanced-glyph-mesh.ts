import {
  Box3,
  InstancedBufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Material,
  Mesh,
  Object3DEventMap,
  PlaneGeometry,
  Sphere,
} from 'three'
import { RootContext } from '../../context.js'
import { computeWorldToGlobalMatrix } from '../../utils.js'

export class InstancedGlyphMesh extends Mesh {
  public count = 0

  protected readonly isInstancedMesh = true
  public readonly instanceColor = null
  public readonly morphTexture = null
  public readonly boundingBox = new Box3()
  public readonly boundingSphere = new Sphere()

  private readonly customUpdateMatrixWorld = () => computeWorldToGlobalMatrix(this.root, this.matrixWorld)

  constructor(
    protected readonly root: Omit<RootContext, 'glyphGroupManager' | 'panelGroupManager'>,
    public readonly instanceMatrix: InstancedBufferAttribute,
    public readonly instanceRGBA: InstancedBufferAttribute,
    public readonly instanceUV: InstancedBufferAttribute,
    public readonly instanceClipping: InstancedBufferAttribute,
    public readonly instanceRenderSolid: InstancedBufferAttribute,
    material: Material,
  ) {
    const planeGeometry = new PlaneGeometry()
    planeGeometry.translate(0.5, -0.5, 0)
    super(planeGeometry, material)
    this.pointerEvents = 'none'
    planeGeometry.attributes.instanceMatrix = instanceMatrix
    planeGeometry.attributes.instanceUVOffset = instanceUV
    planeGeometry.attributes.instanceRGBA = instanceRGBA
    planeGeometry.attributes.instanceClipping = instanceClipping
    planeGeometry.attributes.instanceRenderSolid = instanceRenderSolid

    // Provide vec4 attributes for WebGPU TSL compatibility
    const clippingInterleaved = new InstancedInterleavedBuffer(instanceClipping.array, 16, 1)
    planeGeometry.attributes.instanceClipping0 = new InterleavedBufferAttribute(clippingInterleaved, 4, 0)
    planeGeometry.attributes.instanceClipping1 = new InterleavedBufferAttribute(clippingInterleaved, 4, 4)
    planeGeometry.attributes.instanceClipping2 = new InterleavedBufferAttribute(clippingInterleaved, 4, 8)
    planeGeometry.attributes.instanceClipping3 = new InterleavedBufferAttribute(clippingInterleaved, 4, 12)

    this.onBeforeRender = () => {
      clippingInterleaved.version = instanceClipping.version
    }

    this.frustumCulled = false
    root.onUpdateMatrixWorldSet.add(this.customUpdateMatrixWorld)
  }

  clone(): this {
    const cloned = new InstancedGlyphMesh(
      this.root,
      this.instanceMatrix,
      this.instanceRGBA,
      this.instanceUV,
      this.instanceClipping,
      this.instanceRenderSolid,
      this.material as Material,
    ) as this
    cloned.count = this.count
    return cloned
  }

  copy(): this {
    throw new Error('InstancedGlyphMesh.copy() is not supported. Use clone() instead.')
  }

  dispose() {
    this.root.onUpdateMatrixWorldSet.delete(this.customUpdateMatrixWorld)
    this.dispatchEvent({ type: 'dispose' as keyof Object3DEventMap })
    this.geometry.dispose()
  }

  //functions not needed because intersection (and morphing) is intenionally disabled
  computeBoundingBox(): void {}
  computeBoundingSphere(): void {}
  updateMorphTargets(): void {}
  raycast(): void {}
  spherecast(): void {}
}
