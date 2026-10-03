import { setWebGPUHandlers } from './registry.js'
import { applyPanelMaterialTSL, createPanelTSLNode } from '../panel/material/tsl.js'
import { applyGlyphMaterialTSL, createGlyphTSLNode } from '../text/render/tsl.js'

export function enableWebGPU() {
  setWebGPUHandlers({
    applyPanelMaterial: applyPanelMaterialTSL,
    applyGlyphMaterial: applyGlyphMaterialTSL,
  })
}

// Automatically register handlers when this module is imported
enableWebGPU()

export { applyPanelMaterialTSL, createPanelTSLNode, applyGlyphMaterialTSL, createGlyphTSLNode }
export * from './registry.js'