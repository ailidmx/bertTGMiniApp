import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api/checkout': {
        target: 'https://casabert.mx',
        changeOrigin: true,
        secure: true
      },
      '/api/storefront': {
        target: 'https://casabert.mx',
        changeOrigin: true,
        secure: true
      }
    }
  }
});