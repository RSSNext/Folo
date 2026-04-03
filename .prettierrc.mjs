/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
export default {
  semi: false,
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: "all",
  objectWrap: "preserve",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./apps/desktop/tailwind.config.ts",
  overrides: [
    {
      files: "apps/mobile/**/*.{css,js,jsx,ts,tsx}",
      options: {
        tailwindConfig: "./apps/mobile/tailwind.config.ts",
      },
    },
    {
      files: "apps/mobile/web-app/html-renderer/**/*.{css,js,jsx,ts,tsx}",
      options: {
        tailwindConfig: "./apps/mobile/web-app/html-renderer/tailwind.config.ts",
      },
    },
    {
      files: "apps/ssr/**/*.{css,html,js,jsx,ts,tsx}",
      options: {
        tailwindConfig: "./apps/ssr/tailwind.config.ts",
      },
    },
  ],
}
