import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@headless-media/core": path.resolve(__dirname, "../packages/media-core/src/index.ts"),
      "@headless-media/react": path.resolve(__dirname, "../packages/media-react/src/index.ts"),
      "@headless-media/ui-react": path.resolve(__dirname, "../packages/media-ui-react/src/index.ts"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});

