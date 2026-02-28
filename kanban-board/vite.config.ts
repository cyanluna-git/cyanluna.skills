import { defineConfig } from "vite";
import dotenv from "dotenv";
import { kanbanApiPlugin } from "./plugins/kanban-api";

dotenv.config();

export default defineConfig({
  plugins: [kanbanApiPlugin()],
  server: {
    port: 5173,
    strictPort: false, // auto-increment if port is in use
    open: true,
  },
});
