import { defineConfig } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { kanbanApiPlugin } from "./plugins/kanban-api";

dotenv.config();

const buildTime = Date.now().toString(36);

function swVersionPlugin() {
  return {
    name: "sw-version",
    writeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw.js");
      if (!fs.existsSync(swPath)) return;
      const updated = fs.readFileSync(swPath, "utf8")
        .replace("kanban-static-v1", `kanban-static-${buildTime}`)
        .replace("kanban-runtime-v1", `kanban-runtime-${buildTime}`);
      fs.writeFileSync(swPath, updated);
    },
  };
}

export default defineConfig({
  plugins: [kanbanApiPlugin(), swVersionPlugin()],
  server: {
    port: 5173,
    strictPort: false, // auto-increment if port is in use
    open: true,
  },
});
