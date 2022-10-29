import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import OMT from "@surma/rollup-plugin-off-main-thread";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    OMT(),
    react(),
    {
      name: "No",
      closeBundle() {
        [
          "node_modules/coi-serviceworker/coi-serviceworker.js",
          "node_modules/@wcrichto/rust-editor/dist/editor.worker.js",
          "node_modules/@wcrichto/screen-recorder/dist/vumeter-worklet.js",
        ].forEach((f) => {
          fs.copyFileSync(f, path.join("dist", path.basename(f)));
        });
      },
    },
  ],
});
