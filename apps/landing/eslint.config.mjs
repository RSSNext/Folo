// @ts-check
import { defineConfig } from 'eslint-config-hyoban'

import recursiveSort from './plugins/eslint-recursive-sort.mjs'

export default defineConfig(
  {
    formatting: false,
    lessOpinionated: true,
    ignores: ['dist/**'],
    preferESM: false,
  },
  {
    settings: {
      tailwindcss: {
        whitelist: ['center'],
      },
    },
    rules: {
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'unicorn/prefer-math-trunc': 'off',
      'unicorn/expiring-todo-comments': 0,
      '@eslint-react/no-clone-element': 0,
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 0,
      // NOTE: Disable this temporarily
      'react-compiler/react-compiler': 0,
      'no-restricted-syntax': 0,
      'package-json/valid-name': 0,

      // disable react compiler rules for now
      'react-hooks/no-unused-directives': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',

      'no-restricted-globals': [
        'error',
        {
          name: 'location',
          message:
            "Since you don't use the same router instance in electron and browser, you can't use the global location to get the route info. \n\n" +
            'You can use `useLocaltion` or `getReadonlyRoute` to get the route info.',
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@stylistic/jsx-self-closing-comp': 'error',
    },
  },
  {
    files: ['locales/**/*.json'],
    plugins: {
      'recursive-sort': recursiveSort,
    },
    rules: {
      'recursive-sort/recursive-sort': 'error',
    },
  },
  {
    files: ['package.json'],
    rules: {
      'package-json/valid-name': 0,
    },
  },
)
