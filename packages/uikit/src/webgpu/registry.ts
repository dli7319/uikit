import type { Material } from 'three'
import type { PanelMaterialInfo } from '../panel/material/create.js'
import type { Font } from '../text/font.js'

export type WebGPUHandlers = {
  applyPanelMaterial: (material: Material, info: PanelMaterialInfo) => void
  applyGlyphMaterial: (material: Material, font: Font) => void
}

let handlers: WebGPUHandlers | undefined

export function setWebGPUHandlers(h: WebGPUHandlers) {
  handlers = h
}

export function getWebGPUHandlers(): WebGPUHandlers | undefined {
  return handlers
}