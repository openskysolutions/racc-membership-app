import type { Plugin } from 'vite';
import path from 'path';

/**
 * Vite plugin to exclude admin components and pages from mobile builds
 * This reduces bundle size by removing unnecessary admin functionality
 */
export function excludeMobileAdminPlugin(): Plugin {
  let isMobileBuild = false;

  // Files and directories to exclude from mobile builds
  const excludePatterns = [
    // Admin pages (exclude edit forms, keep Posts list)
    '/src/pages/admin/PostForm.tsx',
    '/src/pages/admin/PostAuthorForm.tsx',
    '/src/pages/admin/PostAuthors.tsx',
    '/src/pages/admin/PostCategoryForm.tsx',
    '/src/pages/admin/PostCategories.tsx',
    
    // Admin components (Lexical editor and related)
    '/src/components/admin/LexicalEditor.tsx',
    '/src/components/admin/lexical/',
    '/src/components/admin/ImageUpload.tsx',
    '/src/components/admin/GalleryManager.tsx',
    '/src/components/admin/GalleryUpload.tsx',
  ];

  return {
    name: 'vite-plugin-exclude-mobile-admin',
    
    config(config, { mode }) {
      // Detect if this is a mobile build
      isMobileBuild = mode === 'mobile' || mode === 'mobile.production';
    },

    resolveId(source, importer) {
      if (!isMobileBuild || !importer) return null;

      // Normalize the path for comparison
      const normalizedSource = source.startsWith('.') && importer
        ? path.resolve(path.dirname(importer), source)
        : source;

      // Check if this import should be excluded
      const shouldExclude = excludePatterns.some(pattern => {
        if (pattern.endsWith('/')) {
          // Directory pattern - check if path is within directory
          return normalizedSource.includes(pattern) || 
                 normalizedSource.includes(pattern.slice(0, -1));
        } else {
          // File pattern - exact match or match with various extensions
          const withoutExt = pattern.replace(/\.(tsx?|jsx?)$/, '');
          return normalizedSource.endsWith(pattern) ||
                 normalizedSource.endsWith(pattern.replace('.tsx', '')) ||
                 normalizedSource.endsWith(withoutExt);
        }
      });

      if (shouldExclude) {
        // Return a stub module ID
        return '\0virtual:mobile-stub:' + source;
      }

      return null;
    },

    load(id) {
      if (!isMobileBuild) return null;

      // Handle stub modules
      if (id.startsWith('\0virtual:mobile-stub:')) {
        // Return a minimal stub component/module
        if (id.includes('.tsx') || id.includes('.jsx')) {
          // React component stub
          return `
            import { FC } from 'react';
            const MobileStub: FC = () => null;
            export default MobileStub;
            export { MobileStub };
          `;
        } else if (id.includes('.ts') || id.includes('.js')) {
          // JavaScript/TypeScript module stub
          return `
            export default {};
          `;
        }
      }

      return null;
    }
  };
}
