import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "EntranceExamPrep",
    port: 8080,
    https: {
        key: fs.readFileSync(path.resolve(__dirname, 'cert/EntranceExamPrep-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'cert/EntranceExamPrep.pem')),
      },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
