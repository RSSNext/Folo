/** @type {import('tailwindcss').Config} */
import { withUIKit } from "react-native-uikit-colors/tailwind"

export default withUIKit({
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],

  plugins: [require("@tailwindcss/typography")],
  theme: {
    extend: {
      fontSize: {
        // Override Tailwind's default fontSize presets
        xs: ["var(--text-xs)", "var(--text-xs-line-height)"], // 12px, 16px
        sm: ["var(--text-sm)", "var(--text-sm-line-height)"], // 14px, 20px
        base: ["var(--text-base)", "var(--text-base-line-height)"], // 16px, 24px
        lg: ["var(--text-lg)", "var(--text-lg-line-height)"], // 18px, 28px
        xl: ["var(--text-xl)", "var(--text-xl-line-height)"], // 20px, 28px
        "2xl": ["var(--text-2xl)", "var(--text-2xl-line-height)"], // 24px, 32px
        "3xl": ["var(--text-3xl)", "var(--text-3xl-line-height)"], // 30px, 36px
        "4xl": ["var(--text-4xl)", "var(--text-4xl-line-height)"], // 36px, 40px
        "5xl": ["var(--text-5xl)", "var(--text-5xl-line-height)"], // 48px, 48px
        "6xl": ["var(--text-6xl)", "var(--text-6xl-line-height)"], // 60px, 60px
        "7xl": ["var(--text-7xl)", "var(--text-7xl-line-height)"], // 72px, 72px
        "8xl": ["var(--text-8xl)", "var(--text-8xl-line-height)"], // 96px, 96px
        "9xl": ["var(--text-9xl)", "var(--text-9xl-line-height)"], // 128px, 128px

        // Custom font sizes
        largeTitle: ["var(--text-large-title)", "var(--text-large-title-line-height)"], // 32px
        title1: ["var(--text-title-1)", "var(--text-title-1-line-height)"], // 28px
        title2: ["var(--text-title-2)", "var(--text-title-2-line-height)"], // 24px
        title3: ["var(--text-title-3)", "var(--text-title-3-line-height)"], // 20px
        headline: ["var(--text-headline)", "var(--text-headline-line-height)"], // 18px
        body: ["var(--text-body)", "var(--text-body-line-height)"], // 16px
        callout: ["var(--text-callout)", "var(--text-callout-line-height)"], // 14px
        subheadline: ["var(--text-subheadline)", "var(--text-subheadline-line-height)"], // 13px
        footnote: ["var(--text-footnote)", "var(--text-footnote-line-height)"], // 12px
        caption: ["var(--text-caption)", "var(--text-caption-line-height)"], // 11px
      },
      fontFamily: {
        mono: "monospace",
      },
      colors: {
        accent: "#FF5C00",
      },
    },
  },
})
