import { Editor, RustAnalyzer } from "@wcrichto/rust-editor";
import _ from "lodash";
import React, { useState } from "react";

import spinnerUrl from "./assets/spinner.gif";

export interface EvalResult {
  success: boolean;
  stdout: string;
  stderr: string;
}
export let evalRust = async (contents: string): Promise<EvalResult> => {
  var params = {
    channel: "stable",
    mode: "debug",
    code: contents,
    edition: "2021",
    crateType: contents.includes("fn main()") ? "bin" : "lib",
    backtrace: false,
    tests: false,
  };

  let response = await fetch("https://play.rust-lang.org/execute", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    mode: "cors",
    body: JSON.stringify(params),
  });

  return await response.json();
};

export let scrollToBottom = () =>
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });

export let RunnableEditor = ({
  ra,
  initialContents,
  onChange,
}: {
  ra?: RustAnalyzer;
  initialContents: string;
  onChange: (s: string) => void;
}) => {
  let [state] = useState(() => ({ contents: initialContents }));
  let [loading, setLoading] = useState(false);
  let [result, setResult] = useState<EvalResult | undefined>(undefined);
  let run = async () => {
    setLoading(true);
    try {
      let result = await evalRust(state.contents);
      setResult(result);
    } catch (e) {
      // todo
    }
    scrollToBottom();
    setLoading(false);
  };
  return (
    <div className="runnable-editor">
      <Editor
        contents={state.contents}
        onChange={(c: any) => {
          state.contents = c;
          onChange(c);
        }}
        ra={ra}
      />
      <div className="output">
        <div>
          <button onClick={run}>Run</button>
        </div>
        {loading ? (
          <img src={spinnerUrl} />
        ) : result ? (
          <div>
            <p>
              {result.success ? (
                <>Compilation has succeeded. The stdout of the process is:</>
              ) : (
                <>Compilation has failed. The stderr of the compiler is:</>
              )}
            </p>
            <pre className={result.success ? "stdout" : "stderr"}>
              {result.success
                ? result.stdout == ""
                  ? "(no stdout)"
                  : result.stdout
                : result.stderr}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
};
