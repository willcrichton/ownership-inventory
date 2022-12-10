import { Editor, RustAnalyzer } from "@wcrichto/rust-editor";
import _ from "lodash";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useContext, useEffect, useState } from "react";

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

export let EditorInstances = React.createContext<
  monaco.editor.IStandaloneCodeEditor[]
>([]);

export let EditorBlock: typeof Editor = props => {
  let insts = useContext(EditorInstances);

  return (
    <div className="editor-wrapper">
      <Editor onInit={editor => insts.push(editor)} {...props} />
    </div>
  );
};

export let RunnableEditor = ({
  initialContents,
  onChange,
}: {
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
      <EditorBlock
        contents={state.contents}
        onChange={(c: any) => {
          state.contents = c;
          onChange(c);
        }}
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
