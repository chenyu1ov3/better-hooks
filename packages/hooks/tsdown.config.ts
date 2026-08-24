import { defineConfig } from 'tsdown';

export default defineConfig({
  // Only hook entry modules are published. Tests and examples live beside
  // each hook but must never become package entry points.
  entry: ['src/index.ts', 'src/use-*/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: false,
  // Source maps embed the TypeScript source in published artifacts. Consumers
  // get the runtime and declaration files without needing maps to execute or
  // typecheck the package.
  sourcemap: false,
  clean: true,
  unbundle: true,
  treeshake: true,
  minify: false,
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
});
