import { defineConfig } from "vite";
import { kanbanApiPlugin } from "./plugins/kanban-api";

export default defineConfig({
  plugins: [kanbanApiPlugin()],
  server: {
    port: 5173,
    strictPort: false, // auto-increment if port is in use
    open: true,
  },
});
