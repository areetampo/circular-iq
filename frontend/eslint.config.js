import pluginReact from 'eslint-plugin-react';
import { baseConfig } from '../eslint.config.base.js';

export default [
  baseConfig,
  pluginReact.configs.flat.recommended,
  {
    // Frontend-specific overrides
    rules: {
      'react/prop-types': 'off', // Example: if you don't want prop-types errors
    },
  },
];
