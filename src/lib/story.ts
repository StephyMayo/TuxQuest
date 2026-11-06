import { STORY, type Chapter } from "@/data/story";
import type { Difficulty, FamilyId, Question } from "@/data/types";
import { correctCommand } from "./answer";

const TYPEABLE = new Set(["write", "complete", "fix"]);

export interface ChapterCommands {
  own: string[];

  review: string[];
}

function porTema(questions: Question[], family: FamilyId, topic: string, difficulty: Difficulty, vistos: Set<string>) {
  const delTema = questions.filter(
    (q) => q.active !== false && q.topic === topic && TYPEABLE.has(q.type) && (q.familyId === null || q.familyId === family),
  );
  const orden: Difficulty[] = [difficulty, ...(["easy", "medium", "hard"] as Difficulty[]).filter((d) => d !== difficulty)];
  const salida: string[] = [];
  for (const d of orden) {
    for (const q of delTema.filter((x) => x.difficulty === d)) {
      const cmd = correctCommand(q).trim();

      if (!cmd || cmd.length > 28 || vistos.has(cmd)) continue;
      vistos.add(cmd);
      salida.push(cmd);
    }
  }
  return salida;
}

export function commandsFor(
  questions: Question[],
  family: FamilyId,
  chapter: Chapter,
  difficulty: Difficulty,
): ChapterCommands {
  const vistos = new Set<string>();
  const own = porTema(questions, family, chapter.topic, difficulty, vistos);
  const indice = STORY.findIndex((c) => c.topic === chapter.topic);
  const review = STORY.slice(0, Math.max(0, indice)).flatMap((c) => porTema(questions, family, c.topic, difficulty, vistos));
  return { own, review };
}

export const OWN_SHARE = 0.7;

export const SPEED: Record<Difficulty, number> = { easy: 3.4, medium: 4.6, hard: 6.2 };

export const SPAWN: Record<Difficulty, number> = { easy: 2.6, medium: 2.1, hard: 1.7 };
