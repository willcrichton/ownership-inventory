const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  if (!deps || deps.length === 0) {
    return baseModule();
  }
  const links = document.getElementsByTagName("link");
  return Promise.all(deps.map((dep) => {
    dep = assetsURL(dep, importerUrl);
    if (dep in seen)
      return;
    seen[dep] = true;
    const isCss = dep.endsWith(".css");
    const cssSelector = isCss ? '[rel="stylesheet"]' : "";
    const isBaseRelative = !!importerUrl;
    if (isBaseRelative) {
      for (let i = links.length - 1; i >= 0; i--) {
        const link2 = links[i];
        if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
          return;
        }
      }
    } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : scriptRel;
    if (!isCss) {
      link.as = "script";
      link.crossOrigin = "";
    }
    link.href = dep;
    document.head.appendChild(link);
    if (isCss) {
      return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
      });
    }
  })).then(() => baseModule());
};
function waitForMsgType(target, type) {
  return new Promise((resolve) => {
    target.addEventListener("message", function onMsg({ data }) {
      if (data == null || data.type !== type)
        return;
      target.removeEventListener("message", onMsg);
      resolve(data);
    });
  });
}
waitForMsgType(self, "wasm_bindgen_worker_init").then(async (data) => {
  const pkg = await __vitePreload(() => import("./wasm_demo.53dabd9c.js"), true ? [] : void 0, import.meta.url);
  await pkg.default(data.module, data.memory);
  postMessage({ type: "wasm_bindgen_worker_ready" });
  pkg.wbg_rayon_start_worker(data.receiver);
});
async function startWorkers(module, memory, builder) {
  const workerInit = {
    type: "wasm_bindgen_worker_init",
    module,
    memory,
    receiver: builder.receiver()
  };
  await Promise.all(
    Array.from({ length: builder.numThreads() }, async () => {
      const worker = new Worker(new URL("workerHelpers.8c811a52.js", import.meta.url), {
        type: "module"
      });
      worker.postMessage(workerInit);
      await waitForMsgType(worker, "wasm_bindgen_worker_ready");
      return worker;
    })
  );
  builder.build();
}
export {
  startWorkers as s
};
