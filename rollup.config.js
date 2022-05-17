import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
// import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: ['src/main.js', 'src/editor.js'],
    output: {
      dir: 'dist',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    plugins: [
      postcss({
        extensions: ['.css'],
        extract: true,
        inject: false,
        minimize: true,
        sourceMap: true,
      }),
      resolve(), // so Rollup can find `three`
      commonjs(),
    ],
  },
];
