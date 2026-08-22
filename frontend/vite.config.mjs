import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const legacyJsxPlugin = {
  name: 'myzubster-legacy-jsx',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\/src\/.*\.js$/.test(id)) return null;
    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic',
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [legacyJsxPlugin, react()],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
    },
    build: {
      outDir: 'build',
    },
  };
});
