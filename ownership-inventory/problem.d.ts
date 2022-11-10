/// <reference types="react" />
import { RustAnalyzer } from "@wcrichto/rust-editor";
export interface Answer {
    errorExplanation: string;
    messageInterpretation: string;
    safetyViolation: string;
    functionFix: string;
}
export declare let Problem: ({ snippet, next, ra, onStep, }: {
    snippet: string;
    ra?: RustAnalyzer | undefined;
    next: (a: Answer) => void;
    onStep?: ((step: number) => void) | undefined;
}) => JSX.Element;
