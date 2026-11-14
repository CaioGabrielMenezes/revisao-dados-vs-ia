import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No build, os arquivos são servidos em https://caiogabrielmenezes.github.io/revisao-dados-vs-ia/
// O preview serve o build, então usa o mesmo caminho; só o `npm run dev` fica na raiz.
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === 'build' || isPreview ? '/revisao-dados-vs-ia/' : '/'
}));
