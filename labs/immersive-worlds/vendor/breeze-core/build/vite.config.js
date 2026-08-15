import { defineConfig } from 'vite';
import tslOperatorPlugin from 'vite-plugin-tsl-operator';

// Library build, one ES module, everything bundled. Nothing is external:
// the Museum has no import map and no bare-specifier resolution, so a build
// that left `three/webgpu` unresolved would produce a file the Museum cannot
// load.
//
// Output goes to `dist/` and the npm script copies it up to `../breeze-core.js`,
// which is the committed artefact. Writing straight into the parent would make
// the build's own sources live inside its output directory — Vite warns about
// exactly that, and an `emptyOutDir` slip would delete the recipe.
export default defineConfig({
  plugins: [tslOperatorPlugin({ logs: false })],
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    lib: {
      entry: 'entry.js',
      formats: ['es'],
      fileName: () => 'breeze-core.js'
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
});
