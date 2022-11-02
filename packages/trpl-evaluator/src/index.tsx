import toml from "@iarna/toml";
import { Quiz, QuizView, TaggedAnswer } from "@wcrichto/quiz";
import { Outro, Recorder, RecordingSetup } from "@wcrichto/screen-recorder";
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { v4 as uuidv4 } from "uuid";

//@ts-ignore
import questionsToml from "../questions.toml?raw";
import "./index.scss";

export let App = () => {
  let [start, setStart] = useState<number | undefined>();
  let uuid = useMemo(() => uuidv4(), []);
  let questions = toml.parse(questionsToml) as any as Quiz;

  let [recorder, setRecorder] = useState<Recorder | undefined>();
  let [stage, setStage] = useState<"start" | "setup" | "quiz" | "end">("start");
  let [quizFinished, setQuizFinished] = useState(false);

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
    setQuizFinished(true);
  };

  return (
    <div className="app">
      {stage == "setup" ? (
        <RecordingSetup
          next={() => setStage("quiz")}
          registerRecorder={recorder => {
            setRecorder(recorder);
            setStart(new Date().getTime());
          }}
        />
      ) : stage == "quiz" ? (
        <>
          <p>
            Next, answer each question in the quiz below.{" "}
            <strong>
              Remember to think aloud as you determine the answer!
            </strong>{" "}
            After completing the quiz, feel free to review your answers if you
            want. Then scroll to the bottom and click "Next".
          </p>
          <QuizView
            name="trpl-evaluator"
            quiz={questions}
            onFinish={onFinish}
          />
          {quizFinished ? (
            <p>
              <button className="next" onClick={() => setStage("end")}>
                Next
              </button>
            </p>
          ) : null}
        </>
      ) : (
        <Outro
          recorder={recorder}
          dropboxUrl={"https://www.dropbox.com/request/2pkEre6XMNrQ7QhzXLit"}
          uuid={uuid}
        />
      )}
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
