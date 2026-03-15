import js from '@eslint/js';
import globals from 'globals';

export const baseConfig = {
  files: ['**/*.{js,mjs,cjs}'],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  rules: {
    ...js.configs.recommended.rules,
    'no-unused-vars': 'off',
    'no-console': 'warn',
    semi: ['error', 'always'],
  },
};
