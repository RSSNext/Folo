import type { Preset } from "@vite-pwa/assets-generator/config"
import { defineConfig } from "@vite-pwa/assets-generator/config"

const minimal2023Preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, "favicon.ico"]],
    padding: 0.05,
    // rgba(255, 92, 0, 1)
    resizeOptions: {
      fit: "contain",
      background: {
        r: 255,
        g: 92,
        b: 0,
        alpha: 1,
      },
    },
  },
  maskable: {
    sizes: [512],
    padding: 0,
    resizeOptions: {
      fit: "contain",
      background: {
        r: 255,
        g: 92,
        b: 0,
        alpha: 1,
      },
    },
  },
  apple: {
    sizes: [180],
    padding: 0,
    resizeOptions: {
      fit: "contain",
      background: {
        r: 255,
        g: 92,
        b: 0,
        alpha: 1,
      },
    },
  },
}

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: minimal2023Preset,
  images: ["public/logo.svg"],
})
