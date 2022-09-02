// @ts-nocheck
import "monaco-editor/esm/vs/editor/browser/coreCommands";
import "monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget";
import "monaco-editor/esm/vs/editor/browser/widget/diffEditorWidget";
import "monaco-editor/esm/vs/editor/browser/widget/diffNavigator";
import "monaco-editor/esm/vs/editor/contrib/anchorSelect/browser/anchorSelect";
import "monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching";
import "monaco-editor/esm/vs/editor/contrib/caretOperations/browser/caretOperations";
import "monaco-editor/esm/vs/editor/contrib/caretOperations/browser/transpose";
import "monaco-editor/esm/vs/editor/contrib/clipboard/browser/clipboard";
import "monaco-editor/esm/vs/editor/contrib/codeAction/browser/codeActionContributions";
import "monaco-editor/esm/vs/editor/contrib/codelens/browser/codelensController";
import "monaco-editor/esm/vs/editor/contrib/colorPicker/browser/colorContributions";
import "monaco-editor/esm/vs/editor/contrib/comment/browser/comment";
import "monaco-editor/esm/vs/editor/contrib/contextmenu/browser/contextmenu";
import "monaco-editor/esm/vs/editor/contrib/cursorUndo/browser/cursorUndo";
import "monaco-editor/esm/vs/editor/contrib/dnd/browser/dnd";
import "monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/documentSymbols";
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController";
import "monaco-editor/esm/vs/editor/contrib/folding/browser/folding";
import "monaco-editor/esm/vs/editor/contrib/fontZoom/browser/fontZoom";
import "monaco-editor/esm/vs/editor/contrib/format/browser/formatActions";
import "monaco-editor/esm/vs/editor/contrib/gotoError/browser/gotoError";
import "monaco-editor/esm/vs/editor/contrib/gotoSymbol/browser/goToCommands";
import "monaco-editor/esm/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition";
import "monaco-editor/esm/vs/editor/contrib/hover/browser/hover";
import "monaco-editor/esm/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace";
import "monaco-editor/esm/vs/editor/contrib/indentation/browser/indentation";
import "monaco-editor/esm/vs/editor/contrib/inlayHints/browser/inlayHintsController";
import "monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations";
import "monaco-editor/esm/vs/editor/contrib/linkedEditing/browser/linkedEditing";
import "monaco-editor/esm/vs/editor/contrib/links/browser/links";
import "monaco-editor/esm/vs/editor/contrib/multicursor/browser/multicursor";
import "monaco-editor/esm/vs/editor/contrib/parameterHints/browser/parameterHints";
import "monaco-editor/esm/vs/editor/contrib/rename/browser/rename";
import "monaco-editor/esm/vs/editor/contrib/smartSelect/browser/smartSelect";
import "monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2";
import "monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController";
import "monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode";
import "monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators";
import "monaco-editor/esm/vs/editor/contrib/viewportSemanticTokens/browser/viewportSemanticTokens";
import "monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter";
import "monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations";
import "monaco-editor/esm/vs/editor/contrib/wordPartOperations/browser/wordPartOperations";
import "monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp";
import "monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard";
import "monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess";
import "monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess";
import "monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch";
import "monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useEffect, useRef, useState } from "react";

import fake_alloc from "./fake_alloc.rs?raw";
import fake_core from "./fake_core.rs?raw";
import fake_std from "./fake_std.rs?raw";
// import './index.css';
import { conf, grammar } from "./rust-grammar";

const MODE_ID = "rust";
let globalSetup = () => {
  self.MonacoEnvironment = {
    getWorkerUrl: () => "./editor.worker.js",
  };

  monaco.languages.register({
    id: MODE_ID,
  });

  monaco.languages.onLanguage(MODE_ID, async () => {
    monaco.languages.setLanguageConfiguration(MODE_ID, conf);
    monaco.languages.setMonarchTokensProvider(MODE_ID, grammar);
  });
};

globalSetup();

type WorkerProxy = { [method: string]: (...args: any[]) => Promise<any> };
export class RustAnalyzer {
  private constructor(readonly state: WorkerProxy) {}

  static async load() {
    console.debug("Creating Rust Analyzer web worker...");
    let state = await RustAnalyzer.createRA();

    console.debug("Initializing Rust Analyzer...");
    let ra = new RustAnalyzer(state);
    ra.registerRA();
    await state.init("fn main(){}", fake_std, fake_core, fake_alloc);

    console.debug("Rust Analyzer ready!");
    return ra;
  }

  async update(model: monaco.editor.ITextModel) {
    console.debug("Updating Rust Analyzer...");
    const res = await this.state.update(model.getValue());
    monaco.editor.setModelMarkers(model, MODE_ID, res.diagnostics);
  }

  private static async createRA(): Promise<WorkerProxy> {
    const worker = new Worker(new URL("./ra-worker.js", import.meta.url), {
      type: "module",
    });
    const pendingResolve = {};

    let id = 1;
    let ready;

    const callWorker = async (which, ...args) => {
      return new Promise((resolve, _) => {
        pendingResolve[id] = resolve;
        worker.postMessage({
          which: which,
          args: args,
          id: id,
        });
        id += 1;
      });
    };

    const proxyHandler = {
      get: (target, prop, _receiver) => {
        if (prop == "then") {
          return Reflect.get(target, prop, _receiver);
        }
        return async (...args) => {
          return callWorker(prop, ...args);
        };
      },
    };

    worker.onmessage = (e) => {
      if (e.data.id == "ra-worker-ready") {
        ready(new Proxy({}, proxyHandler));
        return;
      }
      const pending = pendingResolve[e.data.id];
      if (pending) {
        pending(e.data.result);
        delete pendingResolve[e.data.id];
      }
    };

    return new Promise((resolve, _) => {
      ready = resolve;
    });
  }

  private registerRA() {
    let state = this.state;
    monaco.languages.registerHoverProvider(MODE_ID, {
      provideHover: (_, pos) => this.state.hover(pos.lineNumber, pos.column),
    });
    monaco.languages.registerCodeLensProvider(MODE_ID, {
      async provideCodeLenses(m) {
        const code_lenses = await state.code_lenses();
        const lenses = code_lenses.map(({ range, command }) => {
          const position = {
            column: range.startColumn,
            lineNumber: range.startLineNumber,
          };

          const references = command.positions.map((pos) => ({
            range: pos,
            uri: m.uri,
          }));
          return {
            range,
            command: {
              id: command.id,
              title: command.title,
              arguments: [m.uri, position, references],
            },
          };
        });

        return { lenses, dispose() {} };
      },
    });
    monaco.languages.registerReferenceProvider(MODE_ID, {
      async provideReferences(m, pos, { includeDeclaration }) {
        const references = await state.references(
          pos.lineNumber,
          pos.column,
          includeDeclaration
        );
        if (references) {
          return references.map(({ range }) => ({ uri: m.uri, range }));
        }
      },
    });
    monaco.languages.registerInlayHintsProvider(MODE_ID, {
      async provideInlayHints(model, range, token) {
        let hints = await state.inlay_hints();
        return hints.map((hint) => {
          if (hint.hint_type == 1) {
            return {
              kind: 1,
              position: {
                column: hint.range.endColumn,
                lineNumber: hint.range.endLineNumber,
              },
              text: `: ${hint.label}`,
            };
          }
          if (hint.hint_type == 2) {
            return {
              kind: 2,
              position: {
                column: hint.range.startColumn,
                lineNumber: hint.range.startLineNumber,
              },
              text: `${hint.label}:`,
              whitespaceAfter: true,
            };
          }
        });
      },
    });
    monaco.languages.registerDocumentHighlightProvider(MODE_ID, {
      async provideDocumentHighlights(_, pos) {
        return await state.references(pos.lineNumber, pos.column, true);
      },
    });
    monaco.languages.registerRenameProvider(MODE_ID, {
      async provideRenameEdits(m, pos, newName) {
        const edits = await state.rename(pos.lineNumber, pos.column, newName);
        if (edits) {
          return {
            edits: edits.map((edit) => ({
              resource: m.uri,
              edit,
            })),
          };
        }
      },
      async resolveRenameLocation(_, pos) {
        return state.prepare_rename(pos.lineNumber, pos.column);
      },
    });
    monaco.languages.registerCompletionItemProvider(MODE_ID, {
      triggerCharacters: [".", ":", "="],
      async provideCompletionItems(_m, pos) {
        const suggestions = await state.completions(pos.lineNumber, pos.column);
        if (suggestions) {
          return { suggestions };
        }
      },
    });
    monaco.languages.registerSignatureHelpProvider(MODE_ID, {
      signatureHelpTriggerCharacters: ["(", ","],
      async provideSignatureHelp(_m, pos) {
        const value = await state.signature_help(pos.lineNumber, pos.column);
        if (!value) return null;
        return {
          value,
          dispose() {},
        };
      },
    });
    monaco.languages.registerDefinitionProvider(MODE_ID, {
      async provideDefinition(m, pos) {
        const list = await state.definition(pos.lineNumber, pos.column);
        if (list) {
          return list.map((def) => ({ ...def, uri: m.uri }));
        }
      },
    });
    monaco.languages.registerTypeDefinitionProvider(MODE_ID, {
      async provideTypeDefinition(m, pos) {
        const list = await state.type_definition(pos.lineNumber, pos.column);
        if (list) {
          return list.map((def) => ({ ...def, uri: m.uri }));
        }
      },
    });
    monaco.languages.registerImplementationProvider(MODE_ID, {
      async provideImplementation(m, pos) {
        const list = await state.goto_implementation(
          pos.lineNumber,
          pos.column
        );
        if (list) {
          return list.map((def) => ({ ...def, uri: m.uri }));
        }
      },
    });
    monaco.languages.registerDocumentSymbolProvider(MODE_ID, {
      async provideDocumentSymbols() {
        return await state.document_symbols();
      },
    });
    monaco.languages.registerOnTypeFormattingEditProvider(MODE_ID, {
      autoFormatTriggerCharacters: [".", "="],
      async provideOnTypeFormattingEdits(_, pos, ch) {
        return await state.type_formatting(pos.lineNumber, pos.column, ch);
      },
    });
    monaco.languages.registerFoldingRangeProvider(MODE_ID, {
      async provideFoldingRanges() {
        return await state.folding_ranges();
      },
    });
  }
}

export let Editor: React.FC<{
  ra?: RustAnalyzer;
  contents: string;
  onChange?: (contents: string) => void;
}> = ({ ra, contents, onChange }) => {
  let ref = useRef<HTMLDivElement>(null);
  let [model] = useState(() =>
    monaco.editor.createModel(contents.trim(), MODE_ID)
  );

  useEffect(() => {
    monaco.editor.create(ref.current!, {
      model,
      minimap: {
        enabled: false,
      },
    });
    if (onChange) {
      let dispose = model.onDidChangeContent(() => {
        onChange!(model.getValue());
      });
      return dispose.dispose;
    }
  }, [model]);

  useEffect(() => {
    if (!ra) return;
    ra.update(model);
    let dipose = model.onDidChangeContent(() => ra.update(model));
    return dipose.dispose;
  }, [ra, model]);

  return <div ref={ref} style={{ height: "300px" }} />;
};
