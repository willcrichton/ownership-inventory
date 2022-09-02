import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import OMT from "@surma/rollup-plugin-off-main-thread";
import esbuild from "esbuild";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    OMT(),
    react(),
    {
      buildEnd() {
        fs.copyFileSync(
          "node_modules/coi-serviceworker/coi-serviceworker.js",
          "dist/coi-serviceworker.js"
        );
        esbuild.buildSync({
          entryPoints: [
            "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
          ],
          format: "iife",
          outdir: "dist",
          bundle: true,
          minify: true,
        });
      },
    },
  ],
});
