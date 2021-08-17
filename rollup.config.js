import { minify } from 'terser';

const terser = {
  name: 'terser',
  config: {
    ecma: 5,
    compress: {
      passes: 2,
      collapse_vars: true,
      hoist_funs: true,
      hoist_vars: true,
      hoist_props: true,
      typeofs: false,
      unsafe_comps: true
    }
  },
  renderChunk(code, chunk, options) {
    return minify(code, {
      ...terser.config,
      sourceMap: !!options.sourcemap,
      module: /^(esm?|module)$/.test(options.format),
      toplevel: /^c(ommon)?js$/.test(options.format)
    });
  }
};

export default {
  input: 'lib/index.js',
  output: [
    {
      esModule: false, strict: false,
      file: 'dist/cktjs.cjs',
      format: 'commonjs'
    },
    {
      esModule: false, strict: false,
      file: 'dist/cktjs-browser.js',
      name: 'CKT',
      format: 'iife',
      plugins: [terser]
    }
  ]
};
