import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IDB pergola scrub — plain SPA. Frames live in /public/seq (served as-is).
export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
