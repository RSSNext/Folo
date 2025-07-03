import { rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
rmSync(resolve(__dirname, "../.generated"), { recursive: true, force: true })
// restore env file
