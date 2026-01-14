import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,
    port: 3000,
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
