//  @ts-check

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackConfig } from '@tanstack/eslint-config'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

export default [
  ...tanstackConfig,
  {
    languageOptions: {
      parserOptions: {
        project: path.join(tsconfigRootDir, 'tsconfig.json'),
        tsconfigRootDir,
      },
    },
  },
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
