#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Server Deployment Diagnostics ===');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('\n=== File System Check ===');
console.log('Dist path:', distPath);
console.log('Index path:', indexPath);

try {
  const distExists = fs.existsSync(distPath);
  console.log('Dist directory exists:', distExists);
  
  if (distExists) {
    const files = fs.readdirSync(distPath);
    console.log('Files in dist:', files);
    
    const indexExists = fs.existsSync(indexPath);
    console.log('Index.html exists:', indexExists);
    
    if (indexExists) {
      const stats = fs.statSync(indexPath);
      console.log('Index.html size:', stats.size, 'bytes');
      console.log('Index.html modified:', stats.mtime);
    }
  }
} catch (error) {
  console.error('Error checking files:', error.message);
}

console.log('\n=== Environment ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_PORT:', process.env.FRONTEND_PORT);
console.log('Platform:', process.platform);
console.log('Node version:', process.version);