import {defineConfig} from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  // Keep the locally generated tooth mesh available in the offline demo.html.
  build: {assetsInlineLimit: 8 * 1024 * 1024},
});
