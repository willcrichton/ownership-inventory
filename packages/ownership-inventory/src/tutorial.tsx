import { RustAnalyzer } from "@wcrichto/rust-editor";
import introJs from "intro.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TypeIt from "typeit";

import { EditorInstances } from "./editor";
import { Problem } from "./problem";

const SNIPPET = `
/// Inserts the element 0 into the end of \`v\`.
fn add_zero(v: &Vec<i32>) {
  v.push(0);
}
`.trim();

type Step = introJs.Step & { onClick?: () => void };

const TYPING_SPEED_MS = 20;
let fillIn = (el: Element, text: string) =>
  new (TypeIt as any)(el, { strings: [text], speed: TYPING_SPEED_MS }).go();

let fillInEditor = (
  editor: monaco.editor.IStandaloneCodeEditor,
  text: string
): Promise<void> =>
  new Promise(resolve => {
    let i = 0;
    let intvl = setInterval(() => {
      (editor as any).trigger(
        monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyP,
        "type",
        {
          text: text[i],
        }
      );

      i += 1;
      if (i == text.length) {
        clearInterval(intvl);
        resolve();
      }
    }, TYPING_SPEED_MS);
  });

export let Tutorial = ({
  next,
}: {
  next: () => void;
}) => {
  let ref = useRef<HTMLDivElement>(null);
  let [started, setStarted] = useState(false);
  let [step, setStep] = useState(0);
  let [curTour, setCurTour] = useState<introJs.IntroJs | undefined>();
  let editors = useMemo<monaco.editor.IStandaloneCodeEditor[]>(() => [], []);

  let makeTour = (steps: Step[]) => {
    if (curTour) curTour.exit();
    let tour = introJs();
    let runCallbacks = steps.map(_ => false);
    tour.addSteps(steps);
    tour.setOptions({
      showBullets: false,
      exitOnEsc: false,
      exitOnOverlayClick: false,
      keyboardNavigation: false,
    });
    tour.onafterchange(() => {
      let stepIndex = tour.currentStep()!;
      let prevStepIndex = stepIndex - 1;
      if (stepIndex > 0 && !runCallbacks[prevStepIndex]) {
        let prevStep = steps[prevStepIndex];
        prevStep.onClick && prevStep.onClick();
        runCallbacks[prevStepIndex] = true;
      }

      let nextButton = document.querySelector<HTMLAnchorElement>(
        ".introjs-nextbutton"
      );
      if (!nextButton) return;
      nextButton.style.display =
        stepIndex == steps.length - 1 ? "none" : "inline";
    });
    tour.start();

    setCurTour(tour);

    let intvl: NodeJS.Timer;
    setTimeout(() => {
      intvl = setInterval(() => tour.refresh(), 100);
    }, 1000);
    return () => clearInterval(intvl);
  };

  useEffect(() => {
    if (!started) return;

    let parent = ref.current!;
    let part = parent.querySelector(`.part:nth-child(${step + 1})`)!;
    let position: "right" | "left" = step % 2 == 0 ? "right" : "left";

    if (step == 0) {
      let editor = part.querySelector(".editor")!;
      let moreInfo = part.querySelector(".more-info")!;
      let response = part.querySelector<HTMLTextAreaElement>(".response")!;
      let steps: Step[] = [
        {
          element: part,
          intro: `Each problem focuses on a single program. Read the directions on the left, then click "Next".`,
          position,
        },
        {
          element: editor,
          intro: `
          The code viewer includes some IDE features like types and method definitions. Try hovering your mouse over <code>v</code> and <code>push</code>.
          `,
          position,
        },
        {
          element: moreInfo,
          intro: `
          Each question contains additional instructions to clarify the problem. Try clicking on "More context", read the instructions, and then click the Next button.
          `,
          position,
        },
        {
          element: part,
          intro: `None of these questions have a single correct answer. However, to give you some guidance, I will show you one possible answer. Click the Next button to see the answer.`,
          position,
          onClick: () => {
            let answer =
              "v is an immutable reference to a vector, but the method push expects a mutable reference. An immutable reference cannot be used mutably, so there is an error.";
            fillIn(response, answer);
          },
        },
        {
          element: part,
          intro: "Click the Submit button once you're ready to proceed.",
          position,
        },
      ];
      return makeTour(steps);
    } else if (step == 1) {
      let response = part.querySelector<HTMLTextAreaElement>(".response")!;
      let steps: Step[] = [
        {
          element: part,
          intro:
            "After answering Part 1, you will go to Part 2. You cannot edit your previous answers.<br /><br />Now please read the directions, and click Next when you understand the question.",
          position,
          onClick: () => {
            let answer =
              "This answer is mostly what I expected. However, I don't know why the error says `*v` since that doesn't appear anywhere in the program.";
            fillIn(response, answer);
          },
        },
        {
          element: part,
          intro:
            "Read the provided answer, and click the Submit button once you're ready to proceed.",
          position,
        },
      ];
      return makeTour(steps);
    } else if (step == 2) {
      let response = part.querySelector<HTMLTextAreaElement>(".response")!;
      let steps: Step[] = [
        {
          element: part,
          intro:
            "For Part 3, you will be asked to write Rust code. The code viewer is editable, and you can write your answer there. Click Next to see one possible answer.",
          position,
          onClick: async () => {
            editors[1].setSelection(new monaco.Selection(2, 2, 2, 2));
            let answer = `  let v = vec![1, 2, 3];
  let x = &v[0];
  add_zero(&v);
  println!("{x}");`;
            await fillInEditor(editors[1], answer);
            let justification = `Calling add_zero may cause v to reallocate its contents, which causes x to point to deallocated memory. Reading x in the println therefore violates memory safety.`;
            fillIn(response, justification);
          },
        },
        {
          element: part,
          intro: "Click the Submit button once you're ready to proceed.",
          position,
        },
      ];
      return makeTour(steps);
    } else if (step == 3) {
      let outputArea = part.querySelector(".output")!;
      let timer = parent.querySelector(".timer")!;
      let response = part.querySelector<HTMLTextAreaElement>(".response")!;
      let steps: Step[] = [
        {
          element: part,
          intro:
            "Part 4 will also have you write code. This time, you may use the standard library documentation. Read the directions, then click next.",
          position,
        },
        {
          element: outputArea,
          intro:
            "As you are editing the code, click Run to see the output of the Rust compiler on your program. Try clicking it now.",
          position,
        },
        {
          element: timer,
          intro:
            "Each task should take no more than 15 minutes. This box will track the time you've spent on each task. The experiment will not force you to the next task, but this box provides a guideline so you don't spend too much time on a task.",
          position: "bottom",
        },
        {
          element: part,
          intro: "Click Next to see one possible answer.",
          position,
          onClick: async () => {
            let editor = editors[2];
            editor.setSelection(new monaco.Selection(2, 17, 2, 17));
            await fillInEditor(editor, "mut ");

            fillIn(response, "This function needs to change v, so we should follow the compiler's suggestion and change & to &mut.");
          },
        },
        {
          element: part,
          intro:
            "And that's all the tasks! Click the Submit button to proceed to the main experiment.",
          position,
        },
      ];
      return makeTour(steps);
    }
  }, [started, step]);

  return (
    <EditorInstances.Provider value={editors}>
      <div ref={ref}>
        <p>
          First, we're going to walk through a sample problem. Click this button
          to get started:
        </p>
        <p>
          <button onClick={() => setStarted(true)}>Start Tutorial</button>
        </p>
        {started ? (
          <Problem
            snippet={SNIPPET}
            next={next}
            onStep={step => {
              if (step == 4) curTour!.exit();
              setStep(step);
            }}
          />
        ) : null}
      </div>
    </EditorInstances.Provider>
  );
};
