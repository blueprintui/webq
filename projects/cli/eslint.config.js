import eslint from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const source = ['**/src/**/*.ts', '**/src/*.d.ts'];
const tests = ['**/src/**/*.test.ts'];
const files = [...source, ...tests];
const ignores = ['**/dist/**', '**/node-modules/**', '**/.coverage/**'];

/** @type {import('eslint').Linter.Config} */
const typescriptConfig = {
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest'
    },
    globals: {
      process: 'readonly',
      console: 'readonly',
      NodeJS: 'readonly',
      Headers: 'readonly',
      Bun: 'readonly'
    }
  },
  files,
  ignores,
  plugins: {
    '@typescript-eslint': typescriptPlugin
  },
  rules: {
    ...typescriptPlugin.configs.strict.rules,
    curly: 'error',
    eqeqeq: 'error',
    'no-var': 'error',
    'no-irregular-whitespace': ['error', { skipTemplates: true }],
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: 'Demo|Test', argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-declaration-merging': 'error',
    '@typescript-eslint/no-wrapper-object-types': 'error',
    '@typescript-eslint/no-unsafe-function-type': 'error',
    '@typescript-eslint/no-empty-object-type': 'error',
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/no-restricted-types': [
      'error',
      {
        types: {
          Array: 'use [] instead.',
          Object: 'use {} instead.',
          Boolean: 'use `boolean` instead.',
          Number: 'use `number` instead.',
          String: 'use `string` instead.'
        }
      }
    ]
  }
};

/** @type {import('eslint').Linter.Config} */
const prettierConfig = {
  ...eslintConfigPrettier,
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest'
    }
  },
  files,
  ignores
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores
  },
  eslint.configs.recommended,
  typescriptConfig,
  prettierConfig
];
