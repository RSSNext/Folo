/** @type {import('tailwindcss').Config} */
import { withUIKit } from "react-native-uikit-colors/tailwind"

export default withUIKit({
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],

  plugins: [require("@tailwindcss/typography")],
  theme: {
    extend: {
      fontFamily: {
        mono: "monospace",
      },
      colors: {
        accent: "#FF5C00",
      },
    },
  },
})
