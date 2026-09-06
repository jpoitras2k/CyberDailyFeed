import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Dev-only RSS proxies so the web preview can ingest feeds despite browser CORS.
 * Capacitor/Android builds fetch the official endpoints directly (no CORS).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/proxy/rss/dark-reading": {
        target: "https://www.darkreading.com",
        changeOrigin: true,
        rewrite: () => "/rss.xml",
      },
      "/proxy/rss/the-hacker-news": {
        target: "https://feeds.feedburner.com",
        changeOrigin: true,
        rewrite: () => "/TheHackersNews",
      },
      "/proxy/rss/bleeping-computer": {
        target: "https://www.bleepingcomputer.com",
        changeOrigin: true,
        rewrite: () => "/feed/",
      },
      "/proxy/rss/krebs": {
        target: "https://krebsonsecurity.com",
        changeOrigin: true,
        rewrite: () => "/feed/",
      },
      "/proxy/rss/cisa": {
        target: "https://www.cisa.gov",
        changeOrigin: true,
        rewrite: () => "/cybersecurity-advisories/all.xml",
      },
      "/proxy/html/cisa": {
        target: "https://www.cisa.gov",
        changeOrigin: true,
        rewrite: () => "/news-events/cybersecurity-advisories",
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
