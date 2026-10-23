import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

// O projeto usa arquivos .js (em vez de .jsx) com JSX dentro.
// Por padrão o Vite só entende JSX em arquivos .jsx, então este plugin
// converte o JSX dos arquivos .js da pasta src antes do resto do Vite.
function jsxEmArquivosJs() {
  return {
    name: 'jsx-em-arquivos-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\/src\/.*\.js$/.test(id.split('?')[0])) return null;
      return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'automatic' } });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [jsxEmArquivosJs(), react()],
})
