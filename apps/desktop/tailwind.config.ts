import { extendConfig } from "@follow/configs/tailwindcss/web"
import plugin from "tailwindcss/plugin"

export default extendConfig({
  content: [
    "./layer/renderer/src/**/*.{ts,tsx}",
    "./apps/web/src/**/*.{ts,tsx}",

    "./layer/renderer/index.html",
    "./apps/web/index.html",
    "../../packages/**/*.{ts,tsx}",
    "!../../packages/**/node_modules",
  ],

  safelist: [
    "line-clamp-[1]",
    "line-clamp-[2]",
    "line-clamp-[3]",
    "line-clamp-[4]",
    "line-clamp-[5]",
    "line-clamp-[6]",
    "line-clamp-[7]",
    "line-clamp-[8]",
  ],
  theme: {
    extend: {
      cursor: {
        button: "var(--cursor-button)",
        select: "var(--cursor-select)",
        checkbox: "var(--cursor-checkbox)",
        link: "var(--cursor-link)",
        menu: "var(--cursor-menu)",
        radio: "var(--cursor-radio)",
        switch: "var(--cursor-switch)",
        card: "var(--cursor-card)",
      },

      width: {
        "feed-col": "var(--fo-feed-col-w)",
      },
      spacing: {
        "safe-inset-top": "var(--fo-window-padding-top, 0)",
        "margin-macos-traffic-light-x": "var(--fo-macos-traffic-light-width, 0)",
        "margin-macos-traffic-light-y": "var(--fo-macos-traffic-light-height, 0)",
      },

      height: {
        screen: "100svh",
      },
      colors: {
        sidebar: "hsl(var(--fo-sidebar) / <alpha-value>)",
      },

      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.7" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-x": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-x": "gradient-x 3s linear infinite",
        glow: "glow 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("f-motion-reduce", '[data-motion-reduce="true"] &')
      addVariant("group-motion-reduce", ':merge(.group)[data-motion-reduce="true"] &')
      addVariant("peer-motion-reduce", ':merge(.peer)[data-motion-reduce="true"] ~ &')

      addVariant("zen-mode-macos", ":where(html[data-zen-mode='true'][data-os='macOS']) &")
      addVariant("zen-mode-windows", ":where(html[data-zen-mode='true'][data-os='Windows']) &")

      addVariant("zen-mode", ":where(html[data-zen-mode='true']) &")
      addVariant("macos", ":where(html[data-os='macOS']) &")
      addVariant("windows", ":where(html[data-os='Windows']) &")
    }),
    require("tailwindcss-multi"),
    require("tailwindcss-content-visibility"),
    plugin(({ addUtilities, matchUtilities, theme }) => {
      addUtilities({
        ".safe-inset-top": {
          top: "var(--fo-window-padding-top, 0)",
        },
      })

      const safeInsetTopVariants = {}
      for (let i = 1; i <= 16; i++) {
        safeInsetTopVariants[`.safe-inset-top-${i}`] = {
          top: `calc(var(--fo-window-padding-top, 0px) + ${theme(`spacing.${i}`)})`,
        }
      }
      addUtilities(safeInsetTopVariants)

      // left macos traffic light
      const leftMacosTrafficLightVariants = {}
      addUtilities({
        ".left-macos-traffic-light": {
          left: "var(--fo-macos-traffic-light-width, 0)",
        },
      })

      for (let i = 1; i <= 16; i++) {
        leftMacosTrafficLightVariants[`.left-macos-traffic-light-${i}`] = {
          left: `calc(var(--fo-macos-traffic-light-width, 0px) + ${theme(`spacing.${i}`)})`,
        }
      }
      addUtilities(leftMacosTrafficLightVariants)

      // Add arbitrary value support
      matchUtilities(
        {
          "safe-inset-top": (value) => ({
            top: `calc(var(--fo-window-padding-top, 0px) + ${value})`,
          }),
        },
        { values: theme("spacing") },
      )
    }),
  ],
})
