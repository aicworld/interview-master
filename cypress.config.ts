import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'ij1tyk',
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  },
  viewportWidth: 1200,

  e2e: {
    supportFile: false,
    defaultCommandTimeout: 10000,
    video: false,
    baseUrl: 'http://127.0.0.1:80',
    setupNodeEvents(on) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    }
  }
});
