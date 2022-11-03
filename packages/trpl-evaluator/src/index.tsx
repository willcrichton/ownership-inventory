import toml from "@iarna/toml";
import { Quiz, QuizView, TaggedAnswer } from "@wcrichto/quiz";
import { Outro, Recorder, RecordingSetup } from "@wcrichto/screen-recorder";
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { v4 as uuidv4 } from "uuid";

//@ts-ignore
import questionsToml from "../questions.toml?raw";
import "./index.scss";

let Intro = ({ next }: { next: () => void }) => {
  return (
    <div className="intro">
      <h1>Rust Experiment: Quiz Think-aloud</h1>
      <p>
        This page is a 20-minute experiment by Brown University researchers{" "}
        <a href="https://willcrichton.net/">Will Crichton</a> and{" "}
        <a href="https://cs.brown.edu/~sk/">Shriram Krishnamurthi</a>. In this
        experiment, you will answer 10 multiple-choice questions about the Rust
        programming language.
      </p>
      <p>
        The goal of this experiment is to understand your thought process while
        answering each question. You will be asked to "think aloud", or verbally
        explain your thoughts during the experiment. For example, if you pick a
        particular answer, you should explain why you picked that one and not a
        different one. Your screen and microphone will be recorded for the
        duration of the experiment.
      </p>
      <p>
        <strong>Prerequisites:</strong>
        <ul>
          <li>
            {" "}
            You must have read{" "}
            <a
              href="https://doc.rust-lang.org/book/"
              target="_blank"
              rel="noreferrer"
            >
              <em>The Rust Programming Language</em>
            </a>{" "}
            at least until Chapter 10, OR you must have at least a basic
            familiarity with Rust including ownership and traits.
          </li>
          <li>
            You must have a working microphone, and you should participate in a
            quiet space.
          </li>
        </ul>
      </p>
      <p>
        <button style={{ marginRight: "20px" }} onClick={next}>
          I understand and want to participate
        </button>
        <button onClick={() => alert("Please close this tab.")}>
          I do not want to participate
        </button>
      </p>
    </div>
  );
};

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
      {stage == "start" ? (
        <Intro next={() => setStage("setup")} />
      ) : stage == "setup" ? (
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
          <p>
            <strong>
              Do not stop sharing your screen until the experiment has
              concluded.
            </strong>{" "}
            The recording will automatically stop.
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
