import { Color, PerspectiveCamera, Scene } from 'three'
import '@pmndrs/uikit/webgpu'
import { WebGPURenderer } from 'three/webgpu'
import { reversePainterSortStable, Container, Text } from '@pmndrs/uikit'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { TTFLoader } from '@pmndrs/uikit'
import fontUrl from './BitcountPropSingle-Regular.ttf?url'

window.addEventListener('error', (e) => console.error('WINDOW ERROR:', e.error || e.message))
window.addEventListener('unhandledrejection', (e) => console.error('REJECTION:', e.reason))

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 5

const scene = new Scene()
;(window as any).__scene = scene
scene.background = new Color('black')

const canvas = document.getElementById('root') as HTMLCanvasElement
const { update } = forwardHtmlEvents(canvas, camera, scene)

const renderer = new WebGPURenderer({ antialias: true, canvas, forceWebGL: true })
renderer.setTransparentSort(reversePainterSortStable as any)

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

async function init() {
  await renderer.init()
  updateSize()
  window.addEventListener('resize', updateSize)

  const loader = new TTFLoader()
  const fontFamilies = await loader.loadAsync(fontUrl)

  const root = new Container({
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    fontFamilies,
  })
  root.position.z = -2
  scene.add(root)

  const title = new Text({
    fontSize: 48,
    color: 'white',
    text: 'TTF Loader Example',
  })
  root.add(title)

  const subtitle = new Text({
    fontSize: 24,
    color: 'gray',
    text: 'Loading fonts at runtime with @pmndrs/uikit-ttf',
  })
  root.add(subtitle)

  // animation loop
  let prev: number | undefined
  function animation(time: number) {
    const delta = prev == null ? 0 : time - prev
    prev = time

    update()
    root.update(delta)

    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(animation)
}

init()
