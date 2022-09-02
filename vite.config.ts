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
        let common: esbuild.BuildOptions = {
          format: "iife",
          outdir: "dist",
          bundle: true,
          minify: true,
        };
        esbuild.buildSync({
          entryPoints: [
            "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
          ],
          ...common,
        });
        esbuild.buildSync({
          entryPoints: ["src/vumeter-worklet.js"],
          ...common,
        });
      },
    },
  ],
});
