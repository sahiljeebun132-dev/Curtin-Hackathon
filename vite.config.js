import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is our dev server + production bundler.
// The react() plugin enables JSX compilation and hot-reload while developing.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // auto-open the browser on `npm run dev`
  },
});
