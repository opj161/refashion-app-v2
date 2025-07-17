// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      'public/uploads/',
      'user_data/',
      '**/*.log',
      'tmp/',
    ],
  },
  // Add safety checks
  eslint.configs.recommended,
  ...tseslint.configs.recommended.filter(Boolean),
  nextPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['scripts/**/*.ts', '*.config.{js,ts,mjs}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
).filter(Boolean); // Filter out any undefined configs
