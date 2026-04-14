import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4004,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('🔄 Proxying:', path, '→ http://localhost:3002' + path);
          return path;
        },
      },
    },
  },
});
