import { extendConfig } from "@follow/configs/tailwindcss/web"
import daisyui from "daisyui"
import { withUIKit } from "tailwindcss-uikit-colors/macos"

/** @type {import('tailwindcss').Config} */
export default withUIKit(
  extendConfig({
    content: [
      "./client/**/*.{ts,tsx}",
      "./index.html",
      "./node_modules/@follow/components/**/*.{ts,tsx}",
      "./node_modules/rc-modal-sheet/**/*.{js,ts,tsx}",
      "../../node_modules/rc-modal-sheet/**/*.{js,ts,tsx}",
      "../../packages/**/*.{ts,tsx}",
    ],
    plugins: [daisyui],
    daisyui: {
      logs: false,
      darkTheme: "dark",
      themes: [
        {
          light: {
            "color-scheme": "light",

            primary: "#007AFF", //#0A84FF
            accent: "#FF5C00",
            "accent-content": "#fff",
            neutral: "#212427",

            "base-100": "#fff",
            "base-content": "#0C0A09",

            info: "#32ADE6", // 50 173 230
            success: "#34C759",
            warning: "#ff9f0a",
            error: "#ff453a", // 255 59 48

            "--rounded-btn": "1.9rem",
            "--tab-border": "2px",
            "--tab-radius": ".5rem",
          },
          dark: {
            "color-scheme": "dark",

            primary: "#0A84FF",
            accent: "#FF5C00",
            "accent-content": "#fff",
            neutral: "#2a2a2a",
            "base-100": "#121212",
            "base-content": "#FAFAF9",

            info: "#32ADE6", // 50 173 230
            success: "#34C759",
            warning: "#ff9f0a",
            error: "#ff453a", // 255 59 48

            "--rounded-btn": "1.9rem",
            "--tab-border": "2px",
            "--tab-radius": ".5rem",
          },
        },
      ],
    },
  }),
)
