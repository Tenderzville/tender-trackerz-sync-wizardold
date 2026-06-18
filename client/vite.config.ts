import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  publicDir: "public",
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [path.resolve(__dirname, ".."), path.resolve(__dirname, "./src")],
    },
  },
  build: {
    outDir: "../dist",
    sourcemap: true,
  },
}));
