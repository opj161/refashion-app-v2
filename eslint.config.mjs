import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import localRules from 'eslint-plugin-local-rules'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    plugins: {
      'local-rules': localRules,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'local-rules/enforce-fetch-caching': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
