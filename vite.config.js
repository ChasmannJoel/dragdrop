
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/panel': {
        target: 'http://168.231.70.228:3030',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
