cargo install wasm-pack
git clone https://github.com/rust-analyzer/rust-analyzer-wasm
pushd rust-analyzer-wasm
cd rust-pack
cargo run
cd ../ra-wasm
wasm-pack build --target web --profiling
