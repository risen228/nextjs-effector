const { configure, presets } = require('eslint-kit')

module.exports = configure({
  presets: [
    presets.imports(),
    presets.node(),
    presets.prettier(),
    presets.typescript(),
    presets.react(),
    presets.nextJs(),
    presets.effector(),
  ],
  extend: {
    rules: {
      'effector/no-watch': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/destructuring-assignment': 'off',
      // TODO: rollback when esm imports issue will be fixed
      'import/extensions': 'off',
    },
  },
})
