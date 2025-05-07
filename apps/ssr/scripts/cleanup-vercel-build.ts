import { rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

rmSync(resolve(__dirname, "../.generated"), { recursive: true, force: true })
// restore env file

writeFileSync(
  resolve(__dirname, "../src/lib/env.ts"),
  `export const isDev = process.env.NODE_ENV === "development"`,
)
