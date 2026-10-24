import {defineConfig} from 'vite';

// OFFLINE=1 inlines every asset so tools/package.py can produce the single-file demo.html.
// The default build emits hashed asset files for hosting (Cloudflare Pages, etc.).
const offline=process.env.OFFLINE==='1';

export default defineConfig({
  assetsInclude: ['**/*.glb', '**/*.pptx'],
  // The single-file demo cannot fetch lazy chunks, so the offline build folds them into the entry script.
  build: {assetsInlineLimit: offline ? 8 * 1024 * 1024 : 4096,rollupOptions:{output:{inlineDynamicImports:offline}}},
});
