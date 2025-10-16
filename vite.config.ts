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
  // Reduce memory usage by limiting concurrent operations
  esbuild: {
    target: 'es2020',
    // Remove console logs in production
    drop: ['console', 'debugger'],
  },
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
    force: true,
    // Include large dependencies in optimization to reduce build-time processing
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@lexical/react',
      'lexical'
    ]
  },
  build: {
    // Reduce memory usage during build
    target: 'es2020',
    minify: 'esbuild',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Define the entry point explicitly
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      // Completely ignore the lexical-link symlink during build
      external: (id) => {
        return id.includes('lexical-link');
      },
      output: {
        // Manual chunk splitting to reduce memory usage
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          
          // Lexical editor (large dependency)
          if (id.includes('@lexical/') || id.includes('lexical')) {
            return 'lexical-editor';
          }
          
          // Mermaid diagrams (very large)
          if (id.includes('mermaid')) {
            return 'mermaid';
          }
          
          // Syntax highlighting (large)
          if (id.includes('shiki')) {
            return 'syntax-highlighting';
          }
          
          // UI components
          if (id.includes('@radix-ui/') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('zod')) {
            return 'form-vendor';
          }
          
          // Node modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
