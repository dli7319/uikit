import '@pmndrs/uikit/webgpu'
import { WebGPURenderer } from 'three/webgpu'

export async function createWebGPURenderer(props: any) {
  const canvasElement = props instanceof HTMLCanvasElement ? props : props?.canvas
  const renderer = new WebGPURenderer({
    ...(typeof props === 'object' && props !== null && !(props instanceof HTMLCanvasElement) ? props : {}),
    canvas: canvasElement,
    forceWebGL: true,
  })
  await renderer.init()
  return renderer
}

export * from '../index.js'