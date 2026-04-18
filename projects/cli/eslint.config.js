import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/**', '.wireit/**', '*.config.js'] },
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    files: ['**/*.ts'],
    rules: {
      complexity: ['error', { max: 10 }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['src/cli.ts'],
    rules: {
      'no-irregular-whitespace': 'off'
    }
  }
]);
