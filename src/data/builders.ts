import type { Difficulty, FamilyId, Question, Topic } from "./types.ts";

interface Scope {
  familyId?: FamilyId | null;
  distroId?: string | null;
  cwd?: string;
}

const base = (s: Scope = {}) => ({
  familyId: s.familyId ?? null,
  distroId: s.distroId ?? null,
  ...(s.cwd ? { cwd: s.cwd } : {}),
});

export function choice(
  id: string,
  topic: Topic,
  prompt: string,
  options: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "easy", type: "choice", topic, prompt, answers: [options[0]], options, hint, explanation };
}

export function complete(
  id: string,
  topic: Topic,
  prompt: string,
  template: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "easy", type: "complete", topic, prompt, template, answers, hint, explanation };
}

export function write(
  id: string,
  difficulty: Exclude<Difficulty, "easy">,
  topic: Topic,
  prompt: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty, type: "write", topic, prompt, answers, hint, explanation };
}

export function fix(
  id: string,
  topic: Topic,
  prompt: string,
  broken: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "hard", type: "fix", topic, prompt, broken, answers, hint, explanation };
}
