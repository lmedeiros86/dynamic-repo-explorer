/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Config as TailwindConfig } from 'tailwindcss';
import tailwindConfig from './tailwind.config';

// PostCSS plugins
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    cors: true
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: tailwindConfig as TailwindConfig
        }),
        autoprefixer(),
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Add this to handle CSS imports in tests
    css: true,
    // Add any other test-specific configurations
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Add this to handle CSS modules
    deps: {
      inline: ['@testing-library/user-event'],
    },
  },
});
