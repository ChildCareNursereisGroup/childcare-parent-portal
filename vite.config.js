import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Base path must match the GitHub repo name for GitHub Pages project sites.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/childcare-parent-portal/",
});
