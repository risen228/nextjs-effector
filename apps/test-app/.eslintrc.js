const { configure, presets } = require('eslint-kit')

module.exports = configure({
  allowDebug: process.env.NODE_ENV !== 'production',

  presets: [
    presets.imports(),
    presets.node(),
    presets.prettier(),
    presets.react(),
    presets.nextJs(),
    presets.effector(),
    presets.typescript(),
  ],

  extend: {
    rules: {
      'effector/no-watch': 'off',
    },
  },
})
