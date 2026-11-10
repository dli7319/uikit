import { setWebGPUHandlers } from './registry.js'
import {
  applyClippingMaterialTSL,
  applyPanelMaterialTSL,
  createMaterialClipPlanesNodes,
  createPanelTSLNode,
  createWorldClipOpacityNode,
} from '../panel/material/tsl.js'
import { applyGlyphMaterialTSL, createGlyphTSLNode } from '../text/render/tsl.js'

export function enableWebGPU() {
  setWebGPUHandlers({
    applyPanelMaterial: applyPanelMaterialTSL,
    applyGlyphMaterial: applyGlyphMaterialTSL,
    applyClippingMaterial: applyClippingMaterialTSL,
  })
}

// Automatically register handlers when this module is imported
enableWebGPU()

export {
  applyPanelMaterialTSL,
  createPanelTSLNode,
  applyClippingMaterialTSL,
  createMaterialClipPlanesNodes,
  createWorldClipOpacityNode,
  applyGlyphMaterialTSL,
  createGlyphTSLNode,
}
export * from './registry.js'
