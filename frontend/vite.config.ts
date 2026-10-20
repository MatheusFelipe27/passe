/// <reference types="vitest/config" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Folga para máquinas lentas (a da banca tem 4 vCPUs e roda os testes com a API e a interface no ar):
    // os testes que digitam em formulários grandes podem passar de 20 s. Num teste normal, a folga não é usada.
    testTimeout: 60_000,
  },
});
