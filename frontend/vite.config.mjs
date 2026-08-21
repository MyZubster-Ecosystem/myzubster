import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const legacyJsxModuleTypes = { '.js': 'jsx' };

  return {
    plugins: [react()],
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
    },
    optimizeDeps: {
      rolldownOptions: {
        moduleTypes: legacyJsxModuleTypes,
      },
    },
    build: {
      outDir: 'build',
      rolldownOptions: {
        moduleTypes: legacyJsxModuleTypes,
      },
    },
  };
});
