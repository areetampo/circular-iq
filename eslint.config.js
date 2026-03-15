import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // 1. Ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/backend/datasets/**',
      '**/backend/database/migrations/**',
    ],
  },

  // 2. Base Configuration
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'unused-imports': unusedImports, import: importPlugin },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-console': 'off',
      semi: ['error', 'always'],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/order': [
        'error',
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
              pattern: '{**@/**,**#**}',
              group: 'internal',
              position: 'before',
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

  // 3. Relaxed Rules for Tests & Controllers (NEW)
  {
    files: ['**/*.test.js', 'backend/controllers/**/*.js', 'backend/routes/**/*.js'],
    rules: {
      'unused-imports/no-unused-vars': [
        'warn',
        {
          // This ignores common "placeholder" names in tests and express
          argsIgnorePattern: '^(_|t|next|req|res|params|opts|children)',
          varsIgnorePattern: '^(_|errorResponse|logRequest)',
        },
      ],
    },
  },

  // 4. Frontend Specific Rules (React)
  {
    files: ['frontend/**/*.{js,jsx,mjs}'],
    plugins: { react: pluginReact },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
];
