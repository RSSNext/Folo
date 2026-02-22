import { initWasm } from "@resvg/resvg-wasm"

let initialized = false

let _wasmModule: WebAssembly.Module | null = null

export function setWasmModule(mod: WebAssembly.Module) {
  _wasmModule = mod
}

async function ensureInitialized() {
  if (!initialized) {
    if (_wasmModule) {
      await initWasm(_wasmModule)
    }
    initialized = true
  }
}

export { ensureInitialized }

export { Resvg } from "@resvg/resvg-wasm"
