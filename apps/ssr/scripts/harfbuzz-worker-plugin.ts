import { readFileSync } from "node:fs"
import { createRequire } from "node:module"

import type { TsdownPlugin } from "tsdown"

// Resolve through Satori so the loader, JavaScript API, and WASM always match.
const require = createRequire(import.meta.url)
const satoriRequire = createRequire(require.resolve("satori"))
const loader = satoriRequire.resolve("harfbuzzjs/hb.js")
const api = satoriRequire.resolve("harfbuzzjs/hbjs.js")
const wasm = satoriRequire.resolve("harfbuzzjs/hb.wasm")
const virtualId = "\0folo-harfbuzz-worker"

export function harfbuzzWorkerPlugin(): TsdownPlugin {
  return {
    name: "folo-harfbuzz-worker",
    resolveId(source) {
      if (source === "harfbuzzjs") return virtualId
      if (source === "folo-harfbuzz-wasm") return { id: "./harfbuzz.wasm", external: true }
    },
    load(id) {
      if (id !== virtualId) return
      return `
        import createHarfBuzz from ${JSON.stringify(loader)};
        import createApi from ${JSON.stringify(api)};
        import wasmModule from "folo-harfbuzz-wasm";
        export default createHarfBuzz({
          instantiateWasm(imports, receiveInstance) {
            const instance = new WebAssembly.Instance(wasmModule, imports);
            receiveInstance(instance, wasmModule);
            return instance.exports;
          }
        }).then(createApi);
      `
    },
    transform(code, id) {
      if (id !== loader) return
      // Workerd has WorkerGlobalScope but no browser worker location. Loading
      // uses the static WASM module above, so there is no relative asset URL.
      const nodeEnvironment =
        'typeof process=="object"&&process.versions?.node&&process.type!="renderer"'
      if (!code.includes("self.location.href") || !code.includes(nodeEnvironment)) {
        throw new Error("HarfBuzz loader changed; review the Worker WASM adapter")
      }
      return code
        .replaceAll("self.location.href", '(self.location?.href ?? "")')
        .replace(nodeEnvironment, "false")
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "harfbuzz.wasm", source: readFileSync(wasm) })
    },
  }
}
