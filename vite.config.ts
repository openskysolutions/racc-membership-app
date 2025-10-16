import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Pages from 'vite-plugin-pages';
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from 'url';

export default defineConfig({
  base: './',
  // Explicitly define the main entry point to prevent scanning symlinks
  root: '.',
  plugins: [
    react(),
    svgr(),
    Pages({
      // Options for vite-plugin-pages
      dirs: 'src/pages', // Directory to scan for route files
      extensions: ['jsx', 'tsx'], // File extensions to consider
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
    // Prevent Vite from following symlinks
    preserveSymlinks: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      // Deny serving files from lexical-link directory and strict mode
      deny: ['**/lexical-link/**'],
      strict: true
    },
    watch: {
      // Ignore the symlinked directory from file watching
      ignored: ['**/lexical-link/**']
    }
  },
  optimizeDeps: {
    exclude: ['lexical-link'],
    // Only scan specific entry points
    entries: ['index.html', 'src/**/*.{ts,tsx,js,jsx}'],
    // Force Vite to not follow symlinks for dependency scanning
    force: true
  },
  build: {
    rollupOptions: {
      // Define the entry point explicitly
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      // Completely ignore the lexical-link symlink during build
      external: (id) => {
        return id.includes('lexical-link');
      }
    }
  }
});
