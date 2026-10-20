"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { OutLine, Shell } from "@/lib/shell";

type Entry = { type: "cmd"; prompt: string; text: string } | ({ type: "out" } & OutLine) | { type: "note"; text: string };

export interface TerminalHandle {
  focus: () => void;
  note: (text: string) => void;
}

interface Props {
  shell: Shell;
  disabled?: boolean;
  /** Reto «completar»: la línea se muestra con un hueco editable en lugar de ___ */
  template?: string;
  /** Recibe el comando escrito. Devuelve true si debe ejecutarse en la terminal simulada. */
  onSubmit: (command: string, typed: string) => boolean;
  intro?: string;
}

export const Terminal = forwardRef<TerminalHandle, Props>(function Terminal({ shell, disabled, template, onSubmit, intro }, ref) {
  const [entries, setEntries] = useState<Entry[]>(() => (intro ? [{ type: "note", text: intro }] : []));
  const [input, setInput] = useState("");
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(shell.prompt);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    note: (text: string) => setEntries((e) => [...e, { type: "note", text }]),
  }));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true });
  }, [disabled]);

  const [before, after] = template ? template.split("___") : ["", ""];

  function submit() {
    if (disabled) return;
    const typed = input;
    const command = template ? `${before}${typed}${after}` : typed;
    if (!typed.trim()) return;
    const currentPrompt = shell.prompt;
    setInput("");
    setHistIdx(null);
    const execute = onSubmit(command, typed);
    const cmdEntry: Entry = { type: "cmd", prompt: currentPrompt, text: command };
    if (!execute) {
      setEntries((e) => [...e, cmdEntry]);
      return;
    }
    const res = shell.run(command);
    setPrompt(shell.prompt);
    setEntries((e) => (res.clear ? [] : [...e, cmdEntry, ...res.lines.map((l) => ({ type: "out" as const, ...l }))]));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = shell.history;
      if (!h.length) return;
      e.preventDefault();
      const next = e.key === "ArrowUp" ? (histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1)) : histIdx === null ? null : histIdx + 1 >= h.length ? null : histIdx + 1;
      setHistIdx(next);
      setInput(next === null ? "" : h[next]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const words = input.split(" ");
      words[words.length - 1] = shell.complete(words[words.length - 1]);
      setInput(words.join(" "));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  }

  return (
    <div className="card crt overflow-hidden">
      <div className="relative z-10 flex items-center gap-2 border-b-[3px] border-ink bg-panel-2 px-3 py-2">
        <span className="h-3 w-3 border-2 border-ink bg-bad" aria-hidden="true" />
        <span className="h-3 w-3 border-2 border-ink bg-accent" aria-hidden="true" />
        <span className="h-3 w-3 border-2 border-ink bg-ok" aria-hidden="true" />
        <span className="ml-2 truncate font-crt text-lg leading-none text-muted">{prompt.slice(0, -1)} — terminal simulada</span>
      </div>
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto p-4 font-crt text-[20px] leading-snug text-[var(--term-text)] sm:h-96"
        onClick={() => window.getSelection()?.toString() || inputRef.current?.focus()}
        role="log"
        aria-label="Salida de la terminal"
      >
        {entries.map((e, i) =>
          e.type === "cmd" ? (
            <div key={i} className="whitespace-pre-wrap break-all">
              <Prompt text={e.prompt} /> {e.text}
            </div>
          ) : e.type === "note" ? (
            <div key={i} className="whitespace-pre-wrap text-muted">
              {e.text}
            </div>
          ) : (
            <div key={i} className={`whitespace-pre-wrap break-all ${e.kind === "err" ? "text-bad" : ""}`}>
              {e.text || " "}
            </div>
          ),
        )}
        <div className="flex flex-wrap items-baseline">
          <Prompt text={prompt} />
          <span className="whitespace-pre">&nbsp;{before}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            aria-label={template ? "Escribe lo que falta en el comando" : "Escribe un comando"}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            size={template ? Math.max(4, input.length + 1) : undefined}
            className={`min-w-0 bg-transparent font-crt text-[20px] text-[var(--term-text)] caret-accent outline-none focus-visible:outline-none disabled:opacity-60 ${
              template ? "border-b border-dashed border-accent px-1" : "flex-1"
            }`}
            placeholder={template ? "___" : disabled ? "" : "escribe aquí…"}
          />
          {template && <span className="whitespace-pre">{after}</span>}
        </div>
      </div>
    </div>
  );
});

function Prompt({ text }: { text: string }) {
  const [userHost, path] = text.slice(0, -1).split(":");
  return (
    <span className="shrink-0">
      <span className="text-[var(--term-prompt)]">{userHost}</span>:<span className="text-[var(--term-path)]">{path}</span>$
    </span>
  );
}
