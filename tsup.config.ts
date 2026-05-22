// Build-Konfiguration: bündelt src/bin/main.ts via esbuild zu dist/, ESM, Node20-Target, mit Shebang fürs npx-Binary.
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/main.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
});
