import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ESlintPluginUseCSSToken',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
  },
});
