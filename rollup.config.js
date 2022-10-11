/* eslint-disable import/no-default-export */
/* eslint-disable no-unused-vars */

import { getBabelInputPlugin } from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import bundleSize from 'rollup-plugin-bundle-size'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const TYPECHECK = true
const MINIFY = true

const src = (file) => `library/${file}`
const dist = (file) => `dist/${file}`

const bundle = (input, { plugins = [], ...config }) =>
  defineConfig({
    ...config,
    input,
    plugins: plugins.filter(Boolean).concat(bundleSize()),

    // do not bundle packages
    external: (id) => !/^[./]/.test(id),
  })

const config = defineConfig([
  /* Compiled JS (CommonJS) */
  bundle(src('index.ts'), {
    plugins: [
      TYPECHECK && typescript({ outputToFilesystem: false }),
      esbuild(),
      MINIFY && terser(),
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
    ],
  }),

  /* Compiled JS (ESM) */
  bundle(src('index.ts'), {
    plugins: [
      TYPECHECK && typescript({ outputToFilesystem: false }),
      getBabelInputPlugin({
        babelrc: false,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: ['@babel/preset-typescript', '@babel/preset-react'],
        babelHelpers: 'bundled',
        plugins: [
          [
            'module-resolver',
            {
              alias: {
                'effector$': 'effector/effector.mjs',
                'effector-react$': 'effector-react/effector-react.mjs',
                'effector-react/scope$': 'effector-react/scope.mjs',
                'next/router$': 'next/router.js',
              },
            },
          ],
        ],
      }),
      MINIFY && terser(),
    ],
    output: [
      {
        file: pkg.module,
        format: 'es',
      },
    ],
  }),

  /* TS declarations */
  bundle(src('index.ts'), {
    plugins: [
      dts({
        compilerOptions: {
          incremental: false,
        },
      }),
    ],
    output: [
      {
        file: pkg.types,
        format: 'es',
      },
    ],
  }),
])

export default config
