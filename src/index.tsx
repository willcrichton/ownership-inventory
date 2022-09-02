import React, { useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { Editor, RustAnalyzer } from "./editor/mod";

import "./index.scss";

let useScreenRecording = (): {
  start: () => Promise<void>;
  stop: () => void;
  started: boolean;
} => {
  let [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  let start = async () => {
    let videoStream: MediaStream, audioStream: MediaStream;
    try {
      videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        preferCurrentTab: true,
      } as any);
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });
    } catch (err) {
      console.error(err);
      return;
    }

    videoStream.addTrack(audioStream.getTracks()[0]);

    videoStream.getVideoTracks()[0].addEventListener("ended", () => {
      // TODO: handle the case where user cancels recording
    });

    let recorder = new MediaRecorder(videoStream);
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) {
        let mime = e.data.type.split(";")[0];
        console.log("Mime type", mime, e.data.type);
        let exts: { [k: string]: string } = {
          "video/x-matroska": "mkv",
          "video/mp4": "mp4",
        };
        let ext = exts[mime] || "unk";
        let url = URL.createObjectURL(e.data);
        let a = document.createElement("a");
        a.href = url;
        a.download = `recording.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
    recorder.start();
    setRecorder(recorder);
  };

  let stop = () => {
    recorder?.stop();
  };

  return { start, stop, started: recorder !== null };
};

let EditorContext = React.createContext({ content: "" });

let Evaluator = () => {
  let ctx = useContext(EditorContext);
  let [output, setOutput] = useState<string | null>(null);

  let run = async () => {
    var params = {
      version: "stable",
      optimize: "0",
      code: ctx.content,
      edition: "2021",
    };

    let response = await fetch("https://play.rust-lang.org/evaluate.json", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify(params),
    });
    let data = await response.json();
    setOutput(data.result);
  };

  return (
    <div>
      <button onClick={run}>Run</button>
      {output ? <pre>{output}</pre> : null}
    </div>
  );
};

let Problem = () => {
  let snippet = `
// Makes a string to separate lines of text, 
// returning a default if the provided string is blank
fn make_separator(user_str: &str) -> &str {
  if user_str == "" {
    let default = "=".repeat(10);
    &default
  } else {
    user_str
  }
}

fn main(){}
    `;

  let [state] = useState(() => ({ content: snippet }));

  let [ra, setRa] = useState<RustAnalyzer | undefined>(undefined);
  useEffect(() => {
    RustAnalyzer.load().then(setRa);
  }, []);

  return (
    <EditorContext.Provider value={state}>
      <div>
        <Evaluator />
        <Editor
          contents={snippet}
          ra={ra}
          onChange={(s) => (state.content = s)}
        />
      </div>
    </EditorContext.Provider>
  );
};

let App = () => {
  let { start, stop, started } = useScreenRecording();

  return (
    <div>
      <h1>Ownership Inventory</h1>
      <button onClick={start}>Start</button>
      {started ? (
        <button
          onClick={() => {
            stop();
          }}
        >
          Stop
        </button>
      ) : null}
      <Problem />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
