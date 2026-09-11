import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// @ts-ignore - Vite Plugin compatibility issues with mixed versions
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  if (mode === 'development') {
    const tagger = componentTagger();
    if (Array.isArray(tagger)) {
      plugins.push(...tagger);  
    } else {
      // @ts-ignore - Plugin type compatibility issue
      plugins.push(tagger);
    }
  }

  const isElectron = process.env.ELECTRON === 'true';

  return {
    base: isElectron ? './' : '/',
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.flat(),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Code splitting optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
            ],
            // Charts - loaded only when needed
            'charts': ['recharts', 'd3'],
            // Heavy libraries - loaded on demand
            'pdf': ['jspdf', 'pdf-lib', 'pdfjs-dist'],
            'ocr': ['tesseract.js'],
          },
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/${facadeModuleId}-[hash].js`;
          },
        },
        external: isElectron ? ['electron'] : []
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable minification with console/debugger removal in production
      minify: 'esbuild',
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
      exclude: ['tesseract.js', '@huggingface/transformers'],
    },
  };
});
