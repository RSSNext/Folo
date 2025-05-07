import path from "node:path"

import { extendConfig } from "@follow/configs/tailwindcss/web"

const rootDir = path.resolve(__dirname, "../../../..")

export default extendConfig({
  darkMode: "media",
  future: { hoverOnlyWhenSupported: true },
  content: ["./src/**/*.{ts,tsx}", path.resolve(rootDir, "packages/components/src/**/*.{ts,tsx}")],
})
