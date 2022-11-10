import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const INTRO = `
**Summary:** This page is a 45-minute experiment by Brown University researchers 
[Will Crichton](https://willcrichton.net/) and [Shriram Krishnamurthi](https://cs.brown.edu/~sk/).
In this experiment, you will answer a sequence of open-ended questions about ownership 
in Rust. The goal of this experiment is to understand how you think about ownership. 
We will use these results to inform the design of our 
[Rust Book Experiment](https://rust-book.cs.brown.edu/).

**Compensation:** you will be compensated with a $15 Amazon gift card for completing
this experiment in good faith.

**Prerequisites:** you MUST have read [The Rust Programming Language](https://doc.rust-lang.org/book/),
OR have equivalent knowledge of Rust from other sources. You should be familiar with ownership and traits, 
but you do NOT need to be a Rust expert.`;

export let Intro = ({ next }: { next: (email: string) => void }) => {
  let [agreed, setAgreed] = useState(false);
  let [email, setEmail] = useState<string | undefined>();
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
