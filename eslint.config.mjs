// @ts-check
import { fixupPluginRules } from "@eslint/compat"
import stylistic from "@stylistic/eslint-plugin"
import { defineConfig } from "eslint-config-hyoban"
import reactNative from "eslint-plugin-react-native"
import path from "pathe"

import checkI18nJson from "./plugins/eslint/eslint-check-i18n-json.js"
import noDebug from "./plugins/eslint/eslint-no-debug.js"
import packageJsonExtend from "./plugins/eslint/eslint-package-json.js"
import recursiveSort from "./plugins/eslint/eslint-recursive-sort.js"

const presetUpgradeCompatibilityRules = {
  "antfu/no-top-level-await": "off",
  curly: "off",
  "dot-notation": "off",
  "e18e/prefer-array-fill": "off",
  "e18e/prefer-array-from-map": "off",
  "e18e/prefer-array-some": "off",
  "e18e/prefer-nullish-coalescing": "off",
  "e18e/prefer-object-has-own": "off",
  "e18e/prefer-static-regex": "off",
  "e18e/prefer-timer-args": "off",
  "hyoban/md-one-sentence-per-line": "off",
  "import/no-mutable-exports": "off",
  "jsonc/comma-dangle": "off",
  "jsonc/sort-keys": "off",
  "no-alert": "off",
  "no-cond-assign": "off",
  "no-console": "off",
  "no-eval": "off",
  "no-multi-str": "off",
  "no-new": "off",
  "no-shadow-restricted-names": "off",
  "no-throw-literal": "off",
  "no-undef-init": "off",
  "no-unmodified-loop-condition": "off",
  "no-unneeded-ternary": "off",
  "no-useless-computed-key": "off",
  "no-useless-rename": "off",
  "no-useless-return": "off",
  "node/no-deprecated-api": "off",
  "node/prefer-global/buffer": "off",
  "node/prefer-global/process": "off",
  "object-shorthand": "off",
  "one-var": "off",
  "prefer-arrow-callback": "off",
  "prefer-exponentiation-operator": "off",
  "prefer-promise-reject-errors": "off",
  "react-dom/no-flush-sync": "off",
  "react-dom/no-missing-iframe-sandbox": "off",
  "react-refresh/only-export-components": "off",
  "react-web-api/no-leaked-event-listener": "off",
  "react-web-api/no-leaked-timeout": "off",
  "react/no-array-index-key": "off",
  "react/no-children-map": "off",
  "react/no-children-to-array": "off",
  "react/no-context-provider": "off",
  "react/no-missing-key": "off",
  "react/no-nested-component-definitions": "off",
  "react/no-use-context": "off",
  "style/arrow-parens": "off",
  "style/brace-style": "off",
  "style/exp-list-style": "off",
  "style/indent": "off",
  "style/indent-binary-ops": "off",
  "style/jsx-curly-brace-presence": "off",
  "style/jsx-one-expression-per-line": "off",
  "style/jsx-wrap-multilines": "off",
  "style/member-delimiter-style": "off",
  "style/multiline-ternary": "off",
  "style/operator-linebreak": "off",
  "style/quote-props": "off",
  "style/quotes": "off",
  "test/consistent-test-it": "off",
  "test/no-identical-title": "off",
  "test/no-import-node-test": "off",
  "test/prefer-hooks-in-order": "off",
  "test/prefer-lowercase-title": "off",
  "ts/ban-ts-comment": "off",
  "ts/method-signature-style": "off",
  "ts/no-empty-object-type": "off",
  "ts/no-non-null-asserted-optional-chain": "off",
  "ts/no-redeclare": "off",
  "ts/no-require-imports": "off",
  "ts/no-unsafe-function-type": "off",
  "ts/no-use-before-define": "off",
  "unicorn/escape-case": "off",
  "unicorn/number-literal-case": "off",
}

export default defineConfig(
  {
    formatters: false,
    formatting: false,
    lessOpinionated: true,
    stylistic: false,
    yaml: false,
    ignores: [
      ".context/**",
      "resources/**",
      "apps/mobile/android/**",
      "apps/mobile/ios/**",
      "apps/mobile/.expo",
      "apps/mobile/native/build/**",
      "**/generated-routes.ts",
      // Hyoban v7 adds opinionated Markdown linting. Keep the previous repo lint surface.
      "**/*.md",
    ],
    preferESM: false,
    tailwindCSS: {
      order: false,
    },
  },
  {
    settings: {
      tailwindcss: {
        whitelist: ["center"],
      },
    },
    plugins: {
      "no-debug": noDebug,
    },
    rules: {
      ...presetUpgradeCompatibilityRules,
      "no-debug/no-debug-stack": "error",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-negative-arbitrary-values": "off",
      "tailwindcss/enforces-shorthand": "off",
      "tailwindcss/migration-from-tailwind-2": "off",
      "tailwindcss/no-arbitrary-value": "off",
      "tailwindcss/no-contradicting-classname": "off",
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/no-unnecessary-arbitrary-value": "off",
      "react/no-clone-element": 0,
      "react-hooks-extra/no-direct-set-state-in-use-effect": 0,
      "react/no-unnecessary-use-callback": "warn",
      "unicorn/no-array-callback-reference": 0,
      "no-restricted-syntax": 0,
      "no-restricted-globals": [
        "error",
        {
          name: "location",
          message:
            "Since you don't use the same router instance in electron and browser, you can't use the global location to get the route info. \n\n" +
            "You can use `useLocaltion` or `getReadonlyRoute` to get the route info.",
        },
      ],

      // disable react compiler rules for now
      "react-hooks/no-unused-directives": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/component-hook-factories": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",

      "unicorn/require-module-specifiers": "off",
    },
  },
  // use correct tailwind config for eslint
  {
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, "apps/desktop/tailwind.config.ts"),
      },
    },
  },
  {
    files: ["apps/ssr/**/*"],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, "apps/ssr/tailwind.config.ts"),
      },
    },
  },
  {
    files: ["apps/mobile/**/*"],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, "apps/mobile/tailwind.config.ts"),
      },
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: {
      style: stylistic,
    },
    rules: {
      "style/jsx-self-closing-comp": "error",
    },
  },
  // @ts-expect-error
  {
    files: ["locales/**/*.json"],
    plugins: {
      "recursive-sort": recursiveSort,
      "check-i18n-json": checkI18nJson,
    },
    rules: {
      "recursive-sort/recursive-sort": "error",
      "check-i18n-json/valid-i18n-keys": "error",
      "check-i18n-json/no-extra-keys": "error",
    },
  },
  {
    files: ["package.json", "apps/**/package.json", "packages/**/package.json"],
    plugins: {
      "package-json-extend": packageJsonExtend,
    },
    rules: {
      "package-json-extend/ensure-package-version": "error",
      "package-json-extend/no-duplicate-package": "error",
      "package-json/require-type": 0,
    },
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "node:path",
              message:
                "For better cross-platform compatibility, please use 'pathe' instead of 'node:path'",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      // @ts-expect-error
      "react-native": fixupPluginRules(reactNative),
    },
    files: ["apps/mobile/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-native/no-inline-styles": "warn",
    },
  },
)
