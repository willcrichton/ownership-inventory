import toml from "@iarna/toml";
import { Quiz, QuizView, TaggedAnswer } from "@wcrichto/quiz";
import { RecordingSetup } from "@wcrichto/screen-recorder";
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { v4 as uuidv4 } from "uuid";

//@ts-ignore
import questionsToml from "../questions.toml?raw";
import "./index.scss";

export let App = () => {
  let start = useMemo(() => new Date().getTime(), []);
  let uuid = useMemo(() => uuidv4(), []);
  let questions = toml.parse(questionsToml) as any as Quiz;

  let [recorder, setRecorder] = useState<MediaRecorder | undefined>();
  let [stage, setStage] = useState<"start" | "setup" | "quiz" | "end">("setup");

  let onFinish = (answers: TaggedAnswer[]) => {
    let results = {
      start,
      answers,
      uuid,
    };
    fetch("https://mindover.computer/trpl-evaluator", {
      method: "POST",
      body: JSON.stringify(results),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return (
    <div className="app">
      {stage == "setup" ? (
        <RecordingSetup
          next={() => setStage("quiz")}
          registerRecorder={setRecorder}
        />
      ) : (
        <QuizView name="trpl-evaluator" quiz={questions} onFinish={onFinish} />
      )}
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
