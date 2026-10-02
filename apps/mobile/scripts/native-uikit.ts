import { withUIKit } from "react-native-uikit-colors/tailwind"
import type { Config } from "tailwindcss"

import { uiKitAlphaColors } from "../src/lib/uikit-colors"

export const withNativeUIKit = (config: Config) => {
  const result = withUIKit(config)
  Object.assign(
    result.theme!.extend!.colors!,
    Object.fromEntries(
      uiKitAlphaColors.map((name) => {
        const key = name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)
        const prefix = `--color-${name}`
        return [
          key,
          `rgb(var(${prefix}-r) var(${prefix}-g) var(${prefix}-b) / calc(var(${prefix}-alpha) * <alpha-value>))`,
        ]
      }),
    ),
  )
  return result
}
