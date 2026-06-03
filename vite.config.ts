import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  resolve: {
    alias: {
      // lemmy-js-client only uses @tsoa/runtime's decorators as inert spec
      // metadata; the real package eagerly bundles reflect-metadata + validator
      // (~365 kB) into the startup chunk. Swap it for a no-op shim.
      '@tsoa/runtime': fileURLToPath(
        new URL('./src/lib/api/lemmy/tsoa-runtime-shim.ts', import.meta.url),
      ),
    },
  },
  build: {
    sourcemap: true,
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/mono-svelte/**'],
    },
  },
})
