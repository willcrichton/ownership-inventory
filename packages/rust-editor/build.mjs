import esbuild from "esbuild";
import fs from "fs-extra";

esbuild.build({
  entryPoints: ["node_modules/monaco-editor/esm/vs/editor/editor.worker.js"],
  format: "iife",
  outdir: "dist",
  bundle: true,
  minify: true,
});

fs.copyFileSync("src/ra-worker.js", "dist/ra-worker.js");
fs.copySync("rust-analyzer-wasm/ra-wasm/pkg", "dist/ra-wasm");
