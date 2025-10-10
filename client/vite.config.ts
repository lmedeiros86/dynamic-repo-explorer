import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
});
