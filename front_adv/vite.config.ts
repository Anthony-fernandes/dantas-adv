import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = (env.VITE_BACKEND_TARGET || env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/media": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png"],
        manifest: {
          name: "Dantas ADV — Sistema Jurídico",
          short_name: "Dantas ADV",
          description: "Sistema de gestão para escritório de advocacia",
          theme_color: "#0a0a0a",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/app/dashboard",
          scope: "/",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api-publica\.datajud\.cnj\.jus\.br\//,
              handler: "NetworkFirst",
              options: { cacheName: "datajud-cache", expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
            },
            {
              urlPattern: /\/api\//,
              handler: "NetworkFirst",
              options: { cacheName: "api-cache", expiration: { maxEntries: 200, maxAgeSeconds: 300 } },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
