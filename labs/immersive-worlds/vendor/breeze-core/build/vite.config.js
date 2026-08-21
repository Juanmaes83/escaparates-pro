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
  base: './',
  // The donor imports Venus and the fabric maps as modules. Vite emits them as
  // real files beside the bundle and rewrites the imports to URLs relative to
  // the module — which is what lets a build-free Museum load a 5 MB GLB without
  // a 7 MB base64 string in the middle of its JavaScript.
  assetsInclude: ['**/*.glb', '**/*.obj'],
  plugins: [tslOperatorPlugin({ logs: false })],
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    assetsInlineLimit: 0,
    minify: 'esbuild',
    // NOT library mode. Vite inlines every asset in `build.lib` regardless of
    // `assetsInlineLimit`, which turned a 5 MB Venus into a base64 string and
    // the bundle into 11 MB. A plain rollup input emits the GLB, the OBJ and
    // the fabric maps as real files and rewrites the donor's imports to URLs
    // relative to the module.
    modulePreload: false,
    rollupOptions: {
      input: 'entry.js',
      // Without this, Rollup treats the entry as an application root — nothing
      // imports it, so its exports are dead code. The first build of this shape
      // came out at 231 kB with the entire Three namespace shaken out, and would
      // have failed at runtime rather than at build time.
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'breeze-core.js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        inlineDynamicImports: true
      }
    }
  }
});
