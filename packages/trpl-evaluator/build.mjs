import fs from "fs";
fs.copyFileSync(
  "node_modules/@wcrichto/screen-recorder/dist/vumeter-worklet.js",
  "dist/vumeter-worklet.js"
);
