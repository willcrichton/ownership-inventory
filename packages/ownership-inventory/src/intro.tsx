import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import UAParser from "ua-parser-js";

const INTRO = `
**Summary:** This page is a 1-hour experiment by Brown University researchers 
[Will Crichton](https://willcrichton.net/) and [Shriram Krishnamurthi](https://cs.brown.edu/~sk/).
In this experiment, you will answer a sequence of open-ended questions about ownership 
in Rust. The goal of this experiment is to understand how you think about ownership. 
We will use these results to inform the design of our 
[Rust Book Experiment](https://rust-book.cs.brown.edu/).

**Compensation:** you will be compensated with a $20 Amazon gift card for completing
this experiment in good faith.

**Prerequisites:** 
* You MUST have read [The Rust Programming Language](https://doc.rust-lang.org/book/),
OR have equivalent knowledge of Rust from other sources. You do NOT need to be a Rust expert.
* You MUST participate from a computer with a keyboard (not a phone).
`;

export let Intro = ({ next }: { next: (email: string) => void }) => {
  let [agreed, setAgreed] = useState(false);
  let [email, setEmail] = useState<string | undefined>();

  let userAgent = new UAParser(navigator.userAgent).getResult();
  console.log(userAgent);

  let allowedBrowsers = ["Chrome", "Firefox"];
  let isBrave = "brave" in navigator;
  if (!allowedBrowsers.includes(userAgent.browser.name || "") || isBrave) {
    return (
      <div className="container">
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
      {!agreed ? (
        <p>
          <button
            style={{ marginRight: "20px" }}
            onClick={() => setAgreed(true)}
          >
            I understand and want to participate
          </button>
          <button onClick={() => alert("Please close this tab.")}>
            I do not want to participate
          </button>
        </p>
      ) : (
        <>
          <p>
            Please enter your email (we will send compensation here):
            <br />
            <input
              type="email"
              onChange={e => {
                setEmail(e.target.value);
              }}
            />
          </p>
          <p>
            <button disabled={!email} onClick={() => next(email!)}>
              Submit
            </button>
          </p>
        </>
      )}
    </div>
  );
};
