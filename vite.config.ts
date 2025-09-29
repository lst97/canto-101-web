import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { devLocalesApi } from "./plugins/devLocalesApi";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devLocalesApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'i18next-resources-to-backend'],
          utils: ['zod', 'axios'],
          motion: ['motion'],
          radix: ['@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-tabs'],
        },
      },
    },
  },
});
