import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No build, os arquivos são servidos em https://caiogabrielmenezes.github.io/revisao-dados-vs-ia/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/revisao-dados-vs-ia/' : '/'
}));
