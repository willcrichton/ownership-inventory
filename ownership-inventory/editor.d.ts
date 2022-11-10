/// <reference types="react" />
import { RustAnalyzer } from "@wcrichto/rust-editor";
export interface EvalResult {
    success: boolean;
    stdout: string;
    stderr: string;
}
export declare let evalRust: (contents: string) => Promise<EvalResult>;
export declare let scrollToBottom: () => void;
export declare let RunnableEditor: ({ ra, initialContents, onChange, }: {
    ra?: RustAnalyzer | undefined;
    initialContents: string;
    onChange: (s: string) => void;
}) => JSX.Element;
