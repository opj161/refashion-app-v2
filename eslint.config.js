// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

const configs = [
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
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs['flat/recommended'],
  // Your existing custom rules...
].filter(Boolean); // Remove any undefined configs

export default tseslint.config(...configs);
