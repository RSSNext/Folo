import { rmSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { dirname, resolve } from "pathe"

const __dirname = dirname(fileURLToPath(import.meta.url))
rmSync(resolve(__dirname, "../.generated"), { recursive: true, force: true })
// restore env file
