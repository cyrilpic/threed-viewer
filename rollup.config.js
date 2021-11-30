import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/threed-viewer.js',
    output: {
      name: 'threedViewer',
      file: pkg.main,
      format: 'umd',
      sourcemap: true,
      amd: {
        autoId: true,
      },
    },
    plugins: [
      resolve(), // so Rollup can find `three`
    ],
  },

  {
    input: pkg.main,
    output: {
      name: 'threedViewer',
      file: pkg.mainMin,
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve(), // so Rollup can find `three`
      terser(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/threed-viewer.js',
    external: ['three'],
    output: [
      {file: pkg.module, format: 'esm'},
    ],
  },
];
