import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Pages from 'vite-plugin-pages';
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from 'url';

export default defineConfig({
  base: './',
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
  },
});
