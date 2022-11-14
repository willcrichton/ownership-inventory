import { RustAnalyzer } from "@wcrichto/rust-editor";
import _ from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as uuid from "uuid";

import "./index.scss";
import { Intro } from "./intro";
import { Problem } from "./problem";
import { problems as PROBLEMS } from "./problems.toml";
import { Tutorial } from "./tutorial";

let Outro = () => {
  let textarea = useRef<HTMLTextAreaElement>(null);
  let [submitted, setSubmitted] = useState(false);
  let submit = () => {
    fetch("https://mindover.computer/ownership-inventory-feedback", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify({ feedback: textarea.current!.value }),
    });
    setSubmitted(true);
  };
  return (
    <div className="outro">
      <p>
        Thank you for your participation in the experiment! If you have any
        feedback on the format of the experiment, please let us know:
      </p>
      <textarea
        ref={textarea}
        placeholder="Put your feedback here..."
        disabled={submitted}
      />
      <p>
        <button onClick={submit} disabled={submitted}>
          Submit Feedback
        </button>
        {submitted ? " Feedback received. Thanks!" : null}
      </p>
      <p>
        Otherwise, the experiment has concluded. You may close this tab now.
      </p>
    </div>
  );
};

let App = () => {
  let problems = useMemo(() => _.sampleSize(PROBLEMS, 3), []);
  let id = useMemo(() => uuid.v4(), []);
  let start = useMemo(() => new Date().getTime(), []);
  let [stage, setStage] = useState<"start" | "tutorial" | "problems" | "end">(
    "start"
  );
  let [problem, setProblem] = useState(0);
  let [answers] = useState<any[]>([]);
  let [email, setEmail] = useState<string | undefined>();

  let [ra, setRa] = useState<RustAnalyzer | undefined>(undefined);
  useEffect(() => {
    RustAnalyzer.load().then(setRa);
  }, []);

  useEffect(() => {
    if (stage != "start" && stage != "end") {
      window.onbeforeunload = () =>
        "Are you sure you want to exit the experiment before finishing?";
      return () => {
        window.onbeforeunload = null;
      };
    }
  }, [stage]);

  useEffect(() => {
    if (answers.length > 0) {
      let payload = {
        id,
        answers,
        email,
        start,
        end: new Date().getTime(),
      };
      fetch("https://mindover.computer/ownership-inventory", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        mode: "cors",
        body: JSON.stringify(payload),
      });
    }
  });

  return (
    <>
      <div className="container">
        <h1>
          Rust Experiment: Ownership Inventory{" "}
          {stage == "tutorial" ? (
            <>&mdash; Tutorial</>
          ) : stage == "problems" ? (
            <>
              &mdash; Task {problem + 1} / {problems.length}
            </>
          ) : null}
        </h1>
      </div>
      {stage === "start" ? (
        <Intro
          next={(email: string) => {
            setEmail(email);
            setStage("tutorial");
          }}
        />
      ) : stage == "tutorial" ? (
        <Tutorial ra={ra} next={() => setStage("problems")} />
      ) : stage == "problems" ? (
        <Problem
          key={problem}
          snippet={problems[problem].code.trim()}
          ra={ra}
          next={answer => {
            answers.push({
              question: problems[problem].name,
              answer,
            });
            problem + 1 < problems.length
              ? setProblem(problem + 1)
              : setStage("end");
          }}
        />
      ) : (
        <Outro />
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
