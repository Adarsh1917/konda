import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Strips import.meta.hot blocks entirely during the production build stage, stopping WebSocket checks
      ...(isProduction ? { 'import.meta.hot': 'undefined' } : {}),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Completely disable HMR WebSocket to avoid unencrypted retry loops in production/sandboxed environments.
      hmr: false,
    },
  };
});
