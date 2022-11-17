import { motion } from "framer-motion";
import _ from "lodash";
import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import UAParser from "ua-parser-js";

let FadeIn: React.FC<React.PropsWithChildren> = ({ children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {children}
  </motion.div>
);

const INTRO = `
**Summary:** This page is a 1-hour experiment by Brown University researchers 
[Will Crichton](https://willcrichton.net/) and [Shriram Krishnamurthi](https://cs.brown.edu/~sk/).
In this experiment, you will answer a sequence of open-ended questions about ownership 
in Rust. The goal of this experiment is to understand how you think about ownership. 
We will use these results to inform the design of our 
[Rust Book Experiment](https://rust-book.cs.brown.edu/).

**Compensation:** you will be compensated with a $20 Amazon gift card for completing
this experiment. We will send you compensation after verifying you attempted the experiment 
in good faith (e.g. did not leave everything blank).
`;

export let Prerequisites = ({ next }: { next: () => void }) => {
  let prereqs = [
    <>You MUST be 18 years or older.</>,
    <>
      You MUST have read{" "}
      <a href="https://doc.rust-lang.org/book/">
        The Rust Programming Language
      </a>
      , OR have equivalent knowledge of Rust from other sources. (You do not
      need to be a Rust expert!)
    </>,
  ];
  let ref = useRef<HTMLUListElement>(null);
  let onChange = () => {
    let inputs = Array.from(ref.current!.querySelectorAll("input"));
    if (_.every(inputs, el => el.checked)) next();
  };
  return (
    <>
      <p>
        <strong>Prerequisites:</strong> click the checkmark for each
        prerequisite that you satisfy. If you do not satisfy all the
        prerequisites, you cannot participate in this experiment.
      </p>
      <ul ref={ref} className="prerequisites">
        {prereqs.map((el, i) => {
          let name = `prereq${i}`;
          return (
            <li key={i}>
              <input type="checkbox" id={name} onChange={onChange} />
              <label htmlFor={name}>{el}</label>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export let Intro = ({
  next,
}: {
  next: (name: string, email: string) => void;
}) => {
  let [prereq, setPrereq] = useState(false);
  let [consent, setConsent] = useState(false);
  let [name, setName] = useState<string | undefined>();
  let [email, setEmail] = useState<string | undefined>();

  let userAgent = new UAParser(navigator.userAgent).getResult();

  let allowedBrowsers = ["Chrome", "Firefox"];
  let isBrave = "brave" in navigator;
  if (!allowedBrowsers.includes(userAgent.browser.name || "") || isBrave) {
    return (
      <div className="container intro">
        <p>
          Sorry, you cannot participate in this experiment from this browser.
          This experiment uses advanced web features to run{" "}
          <a href="https://github.com/rust-analyzer/rust-analyzer-wasm">
            Rust Analyzer
          </a>
          , and your browser does not support all of them. The set of allowed
          browsers are:
        </p>
        <ul>
          {allowedBrowsers.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p>If you want to participate, please use one of those browsers.</p>
      </div>
    );
  }

  if (
    userAgent.device.type == "mobile" ||
    document.documentElement.clientWidth < 600
  ) {
    return (
      <div className="container">
        Sorry, you cannot participate in this experiment from a phone. This
        experiment requires a physical keyboard and a larger screen. If you want
        to participate, please use a laptop or desktop computer.
      </div>
    );
  }

  return (
    <div className="container">
      <ReactMarkdown>{INTRO}</ReactMarkdown>
      <Prerequisites next={() => setPrereq(true)} />
      {prereq ? (
        <FadeIn>
          <p>
            If you understand the instructions and want to participate in this
            experiment, please provide consent by clicking the appropriate
            button below.
          </p>
          <p>
            <button
              style={{ marginRight: "20px" }}
              onClick={() => setConsent(true)}
            >
              I understand and want to participate
            </button>
            <button onClick={() => alert("Please close this tab.")}>
              I do not want to participate
            </button>
          </p>
        </FadeIn>
      ) : null}
      {consent ? (
        <FadeIn>
          <p>
            To enable us to send you compensation after the experiment, please
            enter your name and email below:
          </p>
          <p>
            <label htmlFor="name">
              <strong>Name: &nbsp;</strong>
            </label>
            <input
              type="text"
              id="name"
              onChange={e => setName(e.target.value)}
            />
          </p>
          <p>
            <label htmlFor="email">
              <strong>Email: &nbsp;</strong>
            </label>
            <input
              type="email"
              id="email"
              onChange={e => setEmail(e.target.value)}
            />
          </p>
        </FadeIn>
      ) : null}
      {name && email ? (
        <FadeIn>
          <p>
            <button disabled={!email} onClick={() => next(name!, email!)}>
              Submit
            </button>
          </p>
        </FadeIn>
      ) : null}
    </div>
  );
};
