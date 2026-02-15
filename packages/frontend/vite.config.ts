import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: ['frontend-production-896c.up.railway.app', '.railway.app', 'www.voxreach.io', 'voxreach.io'],
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    host: true,
  },
});
