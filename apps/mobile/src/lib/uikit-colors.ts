export const uiKitAlphaColors = [
  "separator",
  "nonOpaqueSeparator",
  "systemFill",
  "secondarySystemFill",
  "tertiarySystemFill",
  "quaternarySystemFill",
  "secondaryLabel",
  "tertiaryLabel",
  "quaternaryLabel",
] as const

// NativeWind cannot evaluate UIKit's color-mix(). Separate the channels so its
// native rgb()/calc() resolvers can multiply the intrinsic and utility alpha.
export const getUIKitAlphaVariables = (colors: Record<string, string>) =>
  Object.fromEntries(
    uiKitAlphaColors.flatMap((name) => {
      const [rgb, alpha] = colors[name]!.split("/")
      const [r, g, b] = rgb!.trim().split(/\s+/).map(Number)
      const prefix = `--color-${name}`
      return [
        [`${prefix}-r`, r!],
        [`${prefix}-g`, g!],
        [`${prefix}-b`, b!],
        [`${prefix}-alpha`, Number(alpha ?? 1)],
      ]
    }),
  )
