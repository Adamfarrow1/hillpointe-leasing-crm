import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Disabling set-state-in-effect: setting loading/error state before an
      // async call inside useEffect is a standard React data-fetching pattern.
      // This rule was introduced in eslint-plugin-react-hooks v5 and is overly
      // strict for the patterns used throughout this codebase.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
