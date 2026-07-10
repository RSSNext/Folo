import { defineConfig, importESLintRules } from "@tsslint/config"

export default defineConfig({
  rules: {
    ...(await importESLintRules({
      "react-x/no-leaked-conditional-rendering": "error",
    })),
  },
})
