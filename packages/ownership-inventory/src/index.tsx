import { RustAnalyzer } from "@wcrichto/rust-editor";
import _ from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as uuid from "uuid";

import "./index.scss";
import { Demographics, FadeIn, Intro } from "./intro";
import { Answer, Problem, Timed } from "./problem";
import { problems as PROBLEMS } from "./problems.toml";
import { Tutorial } from "./tutorial";

declare global {
  var COMMIT_HASH: string;
}

const SERVER_URL = `https://mindover.computer`;

type SavedState = "unsaved" | "saved" | "error";

let Outro = ({
  data,
  saved,
}: {
  data: Timed<ExperimentData>;
  saved: SavedState;
}) => {
  let textarea = useRef<HTMLTextAreaElement>(null);
  let [submitted, setSubmitted] = useState(false);
  let submit = () => {
    fetch(`${SERVER_URL}/ownership-inventory-feedback`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify({ feedback: textarea.current!.value }),
    });
    setSubmitted(true);
  };

  let DownloadBackup = () => {
    let url = useMemo(() => {
      let blob = new Blob([JSON.stringify(data)], { type: "text/json" });
      return URL.createObjectURL(blob);
    }, []);
    return (
      <FadeIn>
        <p>
          <strong>ERROR:</strong> The data upload to our server failed. As a
          backup, please download this JSON file:
        </p>
        <p>
          <a href={url} download="experiment-data.json">
            Download JSON
          </a>
        </p>
        <p>
          Then attach it in an email to{" "}
          <a href="mailto:wcrichto@brown.edu">wcrichto@brown.edu</a>
        </p>
      </FadeIn>
    );
  };

  return (
    <div className="outro">
      {saved == "unsaved" ? (
        <p>
          <strong>DO NOT CLOSE THIS TAB.</strong> We are uploading the
          experimental data to our server, please wait...
        </p>
      ) : saved == "saved" ? (
        <FadeIn>
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
        </FadeIn>
      ) : (
        <DownloadBackup />
      )}
    </div>
  );
};

interface TaggedAnswer {
  question: string;
  answer: Timed<Answer>;
}

interface ExperimentData {
  id: string;
  commitHash: string;
  demo: Demographics;
  answers: TaggedAnswer[];
}

let App = () => {
  // let problems = useMemo(() => _.sampleSize(PROBLEMS, 3), []);
  let problems = _.shuffle(["find_nth", "apply_curve", "add_displayable"]).map(
    name => _.find(PROBLEMS, { name })!
  );
  let id = useMemo(() => uuid.v4(), []);
  let start = useMemo(() => new Date().getTime(), []);
  let answers = useMemo<TaggedAnswer[]>(() => [], []);

  let [stage, setStage] = useState<"start" | "tutorial" | "problems" | "end">(
    "start"
  );
  let [problem, setProblem] = useState(0);
  let [demo, setDemo] = useState<Demographics | undefined>();
  let [saved, setSaved] = useState<SavedState>("unsaved");

  let [ra, setRa] = useState<RustAnalyzer | undefined>();
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

  let compileData = (): Timed<ExperimentData> => ({
    id,
    commitHash: COMMIT_HASH,
    answers,
    demo: demo!,
    start,
    end: new Date().getTime(),
  });

  let onSubmitProblem = (answer: Timed<Answer>) => {
    answers.push({
      question: problems[problem].name,
      answer,
    });

    if (answers.length > 0) {
      let promise = fetch(`${SERVER_URL}/ownership-inventory`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        mode: "cors",
        body: JSON.stringify(compileData()),
      });

      if (answers.length == problems.length) {
        promise.then(() => setSaved("saved")).catch(() => setSaved("error"));
      }
    }

    if (problem + 1 < problems.length) setProblem(problem + 1);
    else setStage("end");
  };

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
          next={(demo: Demographics) => {
            setDemo(demo);
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
          next={onSubmitProblem}
        />
      ) : (
        <Outro data={compileData()} saved={saved} />
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
