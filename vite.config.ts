import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// SPA fallback for GitHub Pages: serve index.html for unknown paths (/privacy…)
// by emitting an identical 404.html. Vercel/Netlify use their own configs.
function spaFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const idx = resolve(dist, "index.html");
      if (existsSync(idx)) copyFileSync(idx, resolve(dist, "404.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  server: { host: true },
});
