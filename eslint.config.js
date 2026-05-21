import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/config-helpers';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

// --- Helpers for directory paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  /** SECTION 1: Ignores
   * Respect .gitignore and exclude specific files
   */
  includeIgnoreFile(gitignorePath, import.meta.url),
  {
    ignores: ['eslint.config.js'],
  },

  /** SECTION 2: Base Configuration
   * Applies to all JS/TS files.
   *
   * NOTE: Do NOT use importPlugin.flatConfigs.recommended and
   * importPlugin.flatConfigs.typescript as separate array entries — both register
   * `plugins: { import }` and ESLint flat config forbids registering the same
   * plugin twice across configs that apply to the same files.
   * Instead, register the import plugin once here and spread both sets of rules.
   */
  {
    files: ['**/*.{js,ts,jsx,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      // Merge settings from both import flat configs
      ...importPlugin.flatConfigs.recommended.settings,
      ...importPlugin.flatConfigs.typescript.settings,
      // Ensure TypeScript parser is registered for import resolution
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.js', '.jsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './frontend/tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      // Recommended standards
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      // Import plugin rules — spread from both flat configs instead of stacking entries
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,

      // Override/add specific import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'off',
      'import/namespace': 'error',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-self-import': 'error', // Prevents a file from importing itself
      'import/no-cycle': 'error', // Prevents circular dependencies (A -> B -> A)
      'import/no-useless-path-segments': ['error', { noUselessIndex: true }], // Prevents importing './index'

      // Code style
      'no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

      // Automated import management
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // Import sorting
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            { pattern: '{@/**,#**}', group: 'internal', position: 'before' },
            { pattern: '**/*.css', group: 'index', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  /** SECTION 3: Test Environment
   * Configuration for Vitest/Jest files
   */
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/setupTests.js'],
    languageOptions: {
      globals: {
        ...globals.vitest,
        ...globals.jest,
        vi: 'readonly',
      },
    },
    rules: {
      'no-redeclare': 'off',
      'import/order': 'off',
    },
  },

  /** SECTION 4: Backend Configuration
   * Specific globals and relaxed rules for Node.js controllers/routes
   */
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        logger: 'readonly',
      },
    },
    rules: {
      'unused-imports/no-unused-vars': 'off',
    },
  },

  /** SECTION 4b: Bootstrap load-order exception
   * Side-effect imports must run in strict order: loadEnv → config → logger.
   * Turning off import/order and unused-imports here prevents auto-fix from breaking boot sequence.
   */
  {
    files: ['backend/server/bootstrap.js', 'backend/server/index.js'],
    rules: {
      'import/order': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },

  /** SECTION 5: Frontend Configuration
   * React and Tailwind CSS specific logic
   */
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      react: pluginReact,
      'better-tailwindcss': betterTailwind,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        logger: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        extraFileExtensions: ['.js', '.cjs', '.mjs'],
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Tailwind rules
      ...betterTailwind.configs.recommended.rules,
      'better-tailwindcss/no-unknown-classes': 'off',
      'better-tailwindcss/no-deprecated-classes': 'warn',
      'better-tailwindcss/no-conflicting-classes': 'warn',
      'better-tailwindcss/enforce-canonical-classes': 'off',
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'better-tailwindcss': {
        entryPoint: path.resolve(__dirname, 'frontend/src/index.css'),
      },
    },
  },

  /** SECTION 6: Final Overrides
   * Prettier must be last to disable any formatting rules that conflict
   */
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
