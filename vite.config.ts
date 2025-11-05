import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import Pages from 'vite-plugin-pages';
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/',  // Changed from './' to '/'
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
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Define env variables
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV),
      'import.meta.env.VITE_PLATFORM': JSON.stringify(env.VITE_PLATFORM),
    },
  };
});
