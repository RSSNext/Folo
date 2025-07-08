/* @moduleResolution bundler */
import "./tw-css-plugin"

import { getIconCollections, iconsPlugin } from "@egoist/tailwindcss-icons"
import { cleanupSVG, importDirectorySync, isEmptyColor, parseColors, runSVGO } from "@iconify/tools"
import { compareColors, stringToColor } from "@iconify/utils/lib/colors"
import { merge } from "es-toolkit/compat"
import path, { resolve } from "pathe"
import { theme } from "tailwindcss/defaultConfig"
import type { Config } from "tailwindcss/types/config"
import { withUIKit } from "tailwindcss-uikit-colors/src/macos/tailwind"
import { workspaceRootSync } from "workspace-root"

const workspaceRoot = workspaceRootSync(__dirname)
const twConfig = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    fontSize: {
      ...theme?.fontSize,
      largeTitle: ["1.625rem", "2rem"], // 26px
      title1: ["1.375rem", "1.625rem"], // 22px
      title2: ["1.0625rem", "1.375rem"], // 17px
      title3: ["0.9375rem", "1.25rem"], // 15px
      headline: ["0.8125rem", "1rem"], // 13px
      body: ["0.8125rem", "1rem"], // 13px
      callout: ["0.75rem", "0.9375rem"], // 12px
      subheadline: ["0.6875rem", "0.875rem"], // 11px
      footnote: ["0.625rem", "0.8125rem"], // 10px
      caption: ["0.625rem", "0.8125rem"], // 10px
    },

    extend: {
      fontFamily: {
        theme: "var(--fo-font-family)",
        default: "SN pro, sans-serif, system-ui",
      },

      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",

        accent: "hsl(var(--fo-a) / <alpha-value>)",
        folo: "#FF5C00",

        theme: {
          boxShadow: {
            "context-menu":
              "0px 0px 1px rgba(0, 0, 0, 0.4), 0px 0px 1.5px rgba(0, 0, 0, 0.3), 0px 7px 22px rgba(0, 0, 0, 0.25)",
          },

          item: {
            active: "var(--fo-item-active)",
            hover: "var(--fo-item-hover)",
          },
          selection: {
            active: "var(--fo-selection-active)",
            hover: "var(--fo-selection-hover)",
            foreground: "var(--fo-selection-foreground)",
          },

          inactive: "hsl(var(--fo-inactive) / <alpha-value>)",
          disabled: "hsl(var(--fo-disabled) / <alpha-value>)",

          background: "var(--fo-background)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        background: "80px",
      },

      typography: (theme: any) => ({
        zinc: {
          css: {
            "--tw-prose-body": theme("colors.zinc.500"),
            "--tw-prose-quotes": theme("colors.zinc.500"),
          },
        },
      }),
    },
  },

  plugins: [
    iconsPlugin({
      collections: {
        ...getIconCollections(["mingcute", "simple-icons", "logos"]),
        mgc: getCollections(path.resolve(workspaceRoot!, "./icons/mgc")),
      },
    }),
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/typography"),
    require("tailwindcss-motion"),
    require("tailwindcss-safe-area"),

    require(resolve(__dirname, "./tailwind-extend.css")),
  ],
} satisfies Config

export const extendConfig = (config: Config) => {
  const result = merge({}, withUIKit(twConfig), config)
  if (config.plugins) {
    // Merge plugin array
    result.plugins = [...twConfig.plugins, ...config.plugins]
  }
  return result
}

function getCollections(dir: string) {
  // Import icons
  const iconSet = importDirectorySync(dir, {
    includeSubDirs: false,
  })

  // Validate, clean up, fix palette and optimism
  iconSet.forEachSync((name, type) => {
    if (type !== "icon") {
      return
    }

    const svg = iconSet.toSVG(name)
    if (!svg) {
      // Invalid icon
      iconSet.remove(name)
      return
    }

    // Clean up and optimize icons
    try {
      // Clean up icon code
      cleanupSVG(svg)

      // Change color to `currentColor`
      // Skip this step if icon has hardcoded palette
      const blackColor = stringToColor("black")!
      const whiteColor = stringToColor("white")!
      parseColors(svg, {
        defaultColor: "currentColor",
        callback: (attr, colorStr, color) => {
          if (!color) {
            // Color cannot be parsed!
            throw new Error(`Invalid color: "${colorStr}" in attribute ${attr}`)
          }

          if (isEmptyColor(color)) {
            // Color is empty: 'none' or 'transparent'. Return as is
            return color
          }

          // Change black to 'currentColor'
          if (compareColors(color, blackColor)) {
            return "currentColor"
          }

          // Remove shapes with white color
          if (compareColors(color, whiteColor)) {
            return "remove"
          }

          // NOTE: MGC icons has default color of #10161F
          if (compareColors(color, stringToColor("#10161F")!)) {
            return "currentColor"
          }

          // Icon is not monotone
          return color
        },
      })

      runSVGO(svg)
    } catch (err) {
      // Invalid icon
      console.error(`Error parsing ${name}:`, err)
      iconSet.remove(name)
      return
    }

    // Update icon
    iconSet.fromSVG(name, svg)
  })

  // Export
  return iconSet.export()
}
