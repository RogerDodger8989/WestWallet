// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Byt till önskad port, t.ex. 3001
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});