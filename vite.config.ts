import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [TanStackRouterVite({ target: "react", autoCodeSplitting: true }), react(), tailwindcss(), {
    name: 'production-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', injectTo: 'head-prepend', attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://fra.cloud.appwrite.io wss://fra.cloud.appwrite.io https://*.mapbox.com https://*.tiles.mapbox.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
      } }];
    },
  }],
  build: { sourcemap: false },
  server: {
    proxy: {
      "/appwrite": {
        target: "https://fra.cloud.appwrite.io",
        changeOrigin: true,
        rewrite: (pathName) => pathName.replace(/^\/appwrite/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
