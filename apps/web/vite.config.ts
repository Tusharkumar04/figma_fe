import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@figma-app/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@figma-app/validation': path.resolve(__dirname, '../../packages/validation/src'),
      '@figma-app/document-model': path.resolve(__dirname, '../../packages/document-model/src'),
      '@figma-app/editor-commands': path.resolve(__dirname, '../../packages/editor-commands/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
