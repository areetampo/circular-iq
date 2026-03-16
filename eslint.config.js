import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
// import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierConfig from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/backend/datasets/**',
      '**/backend/database/migrations/**',
    ],
  },

  // Base Configuration
  {
    files: ['**/*.{js,ts,jsx,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Add browser and node globals to avoid "React is not defined" or "window is not defined"
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'writable', // Specifically allows React to be used without manual import
      },
      parser: tsParser, // Use TS parser for all files (it handles JS too)
    },
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      // 'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tsPlugin, // Register TS plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-console': 'off',
      semi: ['error', 'always'],

      'unused-imports/no-unused-imports': 'error', // This rule DELETES the lines
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          // Now any variable starting with _ will be ignored
          varsIgnorePattern: '^_',
          args: 'after-used',
          // Now any argument starting with _ will be ignored
          argsIgnorePattern: '^_',
        },
      ],

      // 'simple-import-sort/imports': 'warn',
      // 'simple-import-sort/exports': 'warn',

      'import/order': [
        'warn',
        {
          // Define the order of the groups
          groups: [
            'builtin', // Node.js built-ins (fs, path)
            'external', // npm packages (express, react)
            'internal', // Your #aliases and @aliases
            ['parent', 'sibling', 'index'], // Relative paths (../ , ./)
            'object',
            'type',
          ],
          // Tell ESLint which patterns are "internal" aliases
          pathGroups: [
            {
              pattern: '{@/**,#**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '**/*.css',
              group: 'index',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always', // Adds a blank line between groups
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // Test globals (Vitest / Jest)
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/setupTests.js'],
    languageOptions: {
      globals: {
        ...globals.vitest, // Adds all Vitest globals at once
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      // Turn off no-redeclare for tests because globals like 'describe'
      // are often flagged by mistake in certain environments
      'no-redeclare': 'off',
    },
  },

  // Relaxed Rules for Controllers
  {
    files: ['backend/controllers/**/*.js', 'backend/routes/**/*.js'],
    rules: {
      'unused-imports/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^(_|t|next|req|res|params|opts|children)',
          varsIgnorePattern: '^(_|errorResponse|logRequest)',
        },
      ],
    },
  },

  // Frontend Specific Rules (React)
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: { react: pluginReact },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // This helps the parser understand TSX
        project: null,
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-undef': 'error', // Re-enable to catch real errors, but handled by globals above
    },
    settings: { react: { version: 'detect' } },
  },

  // Prettier should be last to override any conflicting rules
  prettierConfig,
];
