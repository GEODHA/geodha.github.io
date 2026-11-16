import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync } from "fs";
import type { Plugin } from "vite"; // used by optionalAdminPlugin
import blogStatic, { cmsIndex } from "./vite-plugins/blogStatic";

// ── Optional admin plugin ─────────────────────────────────────────────────────
// src/admin/ is gitignored (local-only). When absent (CI/CD, fresh clones),
// any import that would resolve into that folder is redirected to the committed
// src/admin-stub.tsx file. Using a real file avoids virtual-module null-byte
// issues with esbuild's minification pass.

const adminExists = existsSync(path.resolve(__dirname, "src/admin"));
const ADMIN_STUB  = path.resolve(__dirname, "src/admin-stub.tsx");

const optionalAdminPlugin: Plugin = {
  name: "optional-admin-modules",
  resolveId(id, importer) {
    if (adminExists || !importer) return;
    // Relative paths used in App.tsx: "./admin/pages/Foo"
    if (id.startsWith("./admin/") || id.startsWith("../admin/")) {
      return ADMIN_STUB;
    }
    // Alias-based imports inside the admin folder itself
    if (id.includes("/admin/pages/") || id.includes("/admin/hooks/")) {
      return ADMIN_STUB;
    }
  },
};

// ── Vite config ───────────────────────────────────────────────────────────────

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    optionalAdminPlugin,
    blogStatic(), // per-post link-preview pages + RSS (build only)
    cmsIndex(),   // serve public/cms/index.html at /cms/ locally
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
