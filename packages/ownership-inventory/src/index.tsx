import { RustAnalyzer } from "@wcrichto/rust-editor";
import _ from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as uuid from "uuid";

import "./index.scss";
import { Intro } from "./intro";
import { Problem } from "./problem";
import { Tutorial } from "./tutorial";

const PROBLEMS = [
  `
/// Makes a string to separate lines of text, 
/// returning a default if the provided string is blank
fn make_separator(user_str: &str) -> &str {
  if user_str == "" {
    let default = "=".repeat(10);
    &default
  } else {
    user_str
  }
}
  `,
  `
/// Gets the string out of an option if it exists,
/// returning a default otherwise
fn get_or_default(arg: &Option<String>) -> String {
  if arg.is_none() {
      return String::new();
  }
  let s = arg.unwrap();
  s.clone()
}
    `,
  `
/// Returns the n-th largest element in a slice
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
  elems.sort();
  let t = &elems[n];
  return t.clone();
}
  `,
  `
/// Removes all the zeros in-place from a vector of integers.
fn remove_zeros(v: &mut Vec<i32>) {
  for (i, t) in v.iter().enumerate().rev() {
    if *t == 0 {
      v.remove(i);
    }
  }
}
  `,
  `
struct TestResult {
  /// Student's scores on a test
  scores: Vec<usize>,

  /// A possible value to curve all sores
  curve: Option<usize>
}
impl TestResult {  
  pub fn get_curve(&self) -> &Option<usize> { 
    &self.curve 
  }

  /// If there is a curve, then increments all 
  /// scores by the curve
  pub fn apply_curve(&mut self) {
    if let Some(curve) = self.get_curve() {
      for score in self.scores.iter_mut() {
        *score += *curve;
      }
    }
  }
}
`,
  `
/// Reverses the elements of a vector in-place
fn reverse(v: &mut Vec<i32>) {
  let n = v.len();
  for i in 0 .. n / 2 {
    std::mem::swap(&mut v[i], &mut v[n - i - 1]);
  }
}
`,
  `
/// Adds the string \`s\` to all elements of 
/// the input iterator
fn concat_all(
  iter: impl Iterator<Item = String>,
  s: &str
) -> impl Iterator<Item = String> {
  iter.map(move |s2| s2 + s)
}
`,
  `
/// Adds a Display-able object into a vector of 
/// Display trait objects
use std::fmt::Display;
fn add_displayable<T: Display>(
  v: &mut Vec<Box<dyn Display>>, 
  t: T
) {
  v.push(Box::new(t));
}`,
];

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
  let [stage, setStage] = useState<"start" | "tutorial" | "problems" | "end">(
    "problems"
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
        timestamp: new Date().getTime(),
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
          snippet={problems[problem].trim()}
          ra={ra}
          next={answer => {
            answers.push({
              question: problems[problem],
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
