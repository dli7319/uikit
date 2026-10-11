import {
  Box3,
  InstancedBufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  Object3DEventMap,
  Sphere,
} from 'three'
import { createPanelGeometry } from '../geometry.js'
import { instancedPanelDepthMaterial, instancedPanelDistanceMaterial } from '../material/depth.js'
import { RootContext } from '../../context.js'
import { computeWorldToGlobalMatrix } from '../../utils.js'

export class InstancedPanelMesh extends Mesh {
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
    instanceData: InstancedBufferAttribute,
    instanceClipping: InstancedBufferAttribute,
  ) {
    const panelGeometry = createPanelGeometry()
    super(panelGeometry)
    this.pointerEvents = 'none'
    panelGeometry.attributes.instanceMatrix = instanceMatrix
    panelGeometry.attributes.aData = instanceData
    panelGeometry.attributes.aClipping = instanceClipping

    // Provide vec4 attributes for WebGPU TSL compatibility
    const dataInterleaved = new InstancedInterleavedBuffer(instanceData.array, 16, 1)
    panelGeometry.attributes.aData0 = new InterleavedBufferAttribute(dataInterleaved, 4, 0)
    panelGeometry.attributes.aData1 = new InterleavedBufferAttribute(dataInterleaved, 4, 4)
    panelGeometry.attributes.aData2 = new InterleavedBufferAttribute(dataInterleaved, 4, 8)
    panelGeometry.attributes.aData3 = new InterleavedBufferAttribute(dataInterleaved, 4, 12)

    const clippingInterleaved = new InstancedInterleavedBuffer(instanceClipping.array, 16, 1)
    panelGeometry.attributes.aClipping0 = new InterleavedBufferAttribute(clippingInterleaved, 4, 0)
    panelGeometry.attributes.aClipping1 = new InterleavedBufferAttribute(clippingInterleaved, 4, 4)
    panelGeometry.attributes.aClipping2 = new InterleavedBufferAttribute(clippingInterleaved, 4, 8)
    panelGeometry.attributes.aClipping3 = new InterleavedBufferAttribute(clippingInterleaved, 4, 12)

    this.onBeforeRender = () => {
      dataInterleaved.version = instanceData.version
      clippingInterleaved.version = instanceClipping.version
    }

    this.customDepthMaterial = instancedPanelDepthMaterial
    this.customDistanceMaterial = instancedPanelDistanceMaterial
    this.frustumCulled = false
    root.onUpdateMatrixWorldSet.add(this.customUpdateMatrixWorld)
  }

  dispose() {
    this.root.onUpdateMatrixWorldSet.delete(this.customUpdateMatrixWorld)
    this.dispatchEvent({ type: 'dispose' as keyof Object3DEventMap })
    this.geometry.dispose()
  }

  clone(): this {
    const cloned = new InstancedPanelMesh(
      this.root,
      this.instanceMatrix,
      this.geometry.attributes.aData as InstancedBufferAttribute,
      this.geometry.attributes.aClipping as InstancedBufferAttribute,
    ) as this
    cloned.count = this.count
    cloned.material = this.material
    return cloned
  }

  copy(): this {
    throw new Error('InstancedPanelMesh.copy() is not supported. Use clone() instead.')
  }

  // Functions not needed because intersection and morphing are intentionally disabled.
  computeBoundingBox(): void {}
  computeBoundingSphere(): void {}
  updateMorphTargets(): void {}
  raycast(): void {}
  spherecast(): void {}
}
