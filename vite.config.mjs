import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [glsl(), viteStaticCopy({
        targets: [
          { src: 'src/worker-physics.js', dest: 'src' },
          { src: 'src/libs/cannon.build.js', dest: 'src/libs'}
        ]
      })
  ],
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            fs: 'empty-module',
        },
    },
    server: {
        host: 'localhost',
        port: 3000,
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: 'main.built.js',
            }
        }
    }
});
