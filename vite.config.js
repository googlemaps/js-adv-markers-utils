import {resolve} from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    envPrefix: ['GOOGLE_MAPS', 'VITE'],
    base: mode === 'production' ? env.PRODUCTION_BASEURL : './',
    define: {
      API_VERSION: JSON.stringify(process.env.npm_package_version)
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          examples: resolve(__dirname, './examples/index.html')
        }
      }
    }
  };
});
