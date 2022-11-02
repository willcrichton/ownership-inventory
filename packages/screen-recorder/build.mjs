import fs from "fs"
fs.copyFileSync("src/vumeter-worklet.js", "dist/vumeter-worklet.js")
console.log("File copied!")
