import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

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
            'charts': ['recharts'],
          },
        },
        external: isElectron ? ['electron'] : ['canvg', 'html2canvas', 'dompurify']
      },
      chunkSizeWarningLimit: 2000,
      minify: 'esbuild',
      sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
      exclude: ['tesseract.js', '@huggingface/transformers'],
    },
  };
});
