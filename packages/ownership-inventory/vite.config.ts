import OMT from "@surma/rollup-plugin-off-main-thread";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    OMT(),
    react(),
    {
      name: "StaticFiles",
      closeBundle() {
        [
          "node_modules/coi-serviceworker/coi-serviceworker.js",
          "node_modules/@wcrichto/rust-editor/dist/editor.worker.js",
        ].forEach(f => {
          fs.copyFileSync(f, path.join("dist", path.basename(f)));
        });
      },
    },
  ],
});
