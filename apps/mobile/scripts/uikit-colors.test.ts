import { darkElements, lightElements } from "apple-uikit-colors"
import postcss from "postcss"
import { cssToReactNativeRuntime } from "react-native-css-interop/css-to-rn"
import tailwindcss from "tailwindcss"
import { describe, expect, it, vi } from "vitest"

import { getUIKitAlphaVariables } from "../src/lib/uikit-colors"
import { withNativeUIKit } from "./native-uikit"

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove() {} }),
  },
  Appearance: {
    getColorScheme: () => "light",
    addChangeListener: () => ({ remove() {} }),
  },
  AppState: { addEventListener: () => ({ remove() {} }) },
  Dimensions: {
    get: () => ({ width: 390, height: 844 }),
    addEventListener: () => ({ remove() {} }),
  },
  Platform: { OS: "ios" },
  PixelRatio: {},
  PlatformColor: vi.fn(),
  StyleSheet: {},
}))

// Load the published source through Vitest so native imports can be mocked;
// use the published declarations without typechecking the dependency's source.
const resolverModule = "react-native-css-interop/src/runtime/native/resolve-value.ts"
const { resolveValue } = (await import(
  resolverModule
)) as typeof import("react-native-css-interop/dist/runtime/native/resolve-value")

const alphaColorClasses = [
  "border-separator",
  "border-non-opaque-separator",
  "bg-system-fill",
  "bg-secondary-system-fill",
  "bg-tertiary-system-fill",
  "bg-quaternary-system-fill",
  "text-secondary-label",
  "text-tertiary-label",
  "text-quaternary-label",
]

describe("UIKit alpha colors", () => {
  it("compiles semantic colors for the native runtime", async () => {
    const classes = alphaColorClasses.flatMap((className) => [className, `${className}/50`])
    const config = withNativeUIKit({
      content: [{ raw: classes.join(" ") }],
    })
    const { css } = await postcss([tailwindcss(config)]).process("@tailwind utilities;", {
      from: undefined,
    })
    const compiled = cssToReactNativeRuntime(css)

    for (const className of classes) {
      const ruleSet = compiled.rules?.[className]
      const hasDeclarations = ruleSet?.n?.some((rule) => (rule.d?.length ?? 0) > 0)

      expect(ruleSet?.warnings, className).toBeUndefined()
      expect(hasDeclarations, className).toBe(true)
    }
  })

  it.each([
    [
      "light",
      lightElements,
      "rgba(84, 84, 86, 0.34)",
      "rgba(120, 120, 128, 0.1)",
      "rgba(60, 60, 67, 0.6)",
    ],
    [
      "dark",
      darkElements,
      "rgba(84, 84, 86, 0.6)",
      "rgba(120, 120, 128, 0.18)",
      "rgba(235, 235, 245, 0.6)",
    ],
  ] as const)(
    "resolves %s theme colors and multiplies utility opacity",
    async (_, colors, separator, fill, label) => {
      const classes = ["border-separator", "bg-system-fill/50", "text-secondary-label"]
      const { css } = await postcss([
        tailwindcss(withNativeUIKit({ content: [{ raw: classes.join(" ") }] })),
      ]).process("@tailwind utilities;", { from: undefined })
      const compiled = cssToReactNativeRuntime(css)
      const variables = getUIKitAlphaVariables(colors)
      const actual = classes.map((className) => {
        const declarations = compiled.rules![className]!.n!.flatMap((rule) => rule.d ?? [])
        const declaration = declarations.find((value) => Array.isArray(value) && value.length > 1)!
        if (!Array.isArray(declaration) || !Array.isArray(declaration[0])) {
          throw new TypeError(`Missing dynamic color for ${className}`)
        }
        return resolveValue(
          { variables } as Parameters<typeof resolveValue>[0],
          { variables: {} } as Parameters<typeof resolveValue>[1],
          { effect: { dependencies: new Set(), run() {} }, guards: [] },
          declaration[0] as Parameters<typeof resolveValue>[3],
          {},
        )
      })
      expect(actual).toEqual([separator, fill, label])
    },
  )
})
