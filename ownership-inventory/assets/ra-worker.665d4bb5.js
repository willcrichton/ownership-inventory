import init, { initThreadPool, WorldState } from "./wasm_demo.53dabd9c.js";
import "./workerHelpers.8c811a52.js";
const start = async () => {
  await init();
  await initThreadPool(navigator.hardwareConcurrency);
  const state = new WorldState();
  onmessage = (e) => {
    const { which, args, id } = e.data;
    const result = state[which](...args);
    postMessage({
      id,
      result
    });
  };
};
start().then(() => {
  postMessage({
    id: "ra-worker-ready"
  });
});
