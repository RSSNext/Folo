import { merge } from "es-toolkit/compat"
import plugin from "tailwindcss/plugin"
import resolveConfig from "tailwindcss/resolveConfig"

import { baseTwConfig } from "../../configs/tailwind.base.config"

const isWebBuild = !!process.env.WEB_BUILD || !!process.env.RN_BUILD || !!process.env.VERCEL
export default resolveConfig(
  merge({}, baseTwConfig, {
    content: [
      "./src/renderer/src/**/*.{ts,tsx}",
      "./apps/web/src/**/*.{ts,tsx}",

      "./src/renderer/index.html",
      "./apps/web/index.html",
      "../../packages/**/*.{ts,tsx}",
      "!../../packages/**/node_modules",
    ],
    future: {
      hoverOnlyWhenSupported: isWebBuild,
    },
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

        keyframes: {
          "caret-blink": {
            "0%,70%,100%": { opacity: "1" },
            "20%,50%": { opacity: "0" },
          },
          glow: {
            "0%, 100%": { opacity: "0.5" },
            "50%": { opacity: "0.7" },
          },
        },
        animation: {
          "caret-blink": "caret-blink 1.25s ease-out infinite",
        },
      },
    },
    plugins: [
      ...baseTwConfig.plugins,
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
  }),
)
