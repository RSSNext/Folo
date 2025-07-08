import { extendConfig } from "@follow/configs/tailwindcss/web"
import path from "pathe"

const rootDir = path.resolve(__dirname, "../../../..")

export default extendConfig({
  darkMode: "media",
  future: { hoverOnlyWhenSupported: true },
  content: ["./src/**/*.{ts,tsx}", path.resolve(rootDir, "packages/components/src/**/*.{ts,tsx}")],
})
