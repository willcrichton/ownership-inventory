import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";

esbuild.build({
  entryPoints: ["node_modules/monaco-editor/esm/vs/editor/editor.worker.js"],
  format: "iife",
  outdir: "dist",
  bundle: true,
  // minify: true,
});

fs.copyFileSync("lib/ra-worker.js", "dist/ra-worker.js");
fs.copySync("rust-analyzer-wasm/ra-wasm/pkg", "dist/ra-wasm");

[
  "lib/fake_alloc.rs",
  "lib/fake_core.rs",
  "lib/fake_std.rs",
  "lib/rust-grammar.js",
  "lib/ra-worker.js",
].forEach((f) => {
  fs.copyFileSync(f, path.join("dist", path.basename(f)));
});

// esbuild.build({
//   entryPoints: ["lib/ra-worker.js"],
//   format: "iife",
//   outdir: "dist",
//   bundle: true,
//   // minify: true,
// });

// esbuild.build({
//   entryPoints: ["lib/index.tsx"],
//   format: "esm",
//   outdir: "dist",
//   bundle: true,
//   // minify: true,
//   external: ["react"],
//   loader: {
//     ".rs": "text",
//     ".ttf": "file",
//   }
// });
