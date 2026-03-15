import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';

export default [
  // 1. Global Ignores (Replaces .eslintignore)
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/backend/datasets/**',
      '**/backend/database/migrations/**',
    ],
  },

  // 2. Base Configuration (Applies to all JS/MJS files)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-console': 'off',
      semi: ['error', 'always'],
    },
  },

  // 3. Frontend Specific Rules (React)
  {
    files: ['frontend/**/*.{js,jsx,mjs}'],
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
