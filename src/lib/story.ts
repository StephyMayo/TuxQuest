import { STORY, type Chapter } from "@/data/story";
import type { Difficulty, FamilyId, Question } from "@/data/types";
import { correctCommand } from "./answer";

/** Comandos que se pueden escribir: los de opción múltiple no sirven aquí. */
const TYPEABLE = new Set(["write", "complete", "fix"]);

export interface ChapterCommands {
  /** Los del tema del capítulo: son los que toca aprender. */
  own: string[];
  /** Los de capítulos anteriores, para repasar y dar variedad. */
  review: string[];
}

/** Comandos escribibles de un tema, ordenados empezando por la dificultad elegida. */
function porTema(questions: Question[], family: FamilyId, topic: string, difficulty: Difficulty, vistos: Set<string>) {
  const delTema = questions.filter(
    (q) => q.active !== false && q.topic === topic && TYPEABLE.has(q.type) && (q.familyId === null || q.familyId === family),
  );
  const orden: Difficulty[] = [difficulty, ...(["easy", "medium", "hard"] as Difficulty[]).filter((d) => d !== difficulty)];
  const salida: string[] = [];
  for (const d of orden) {
    for (const q of delTema.filter((x) => x.difficulty === d)) {
      const cmd = correctCommand(q).trim();
      // Los muy largos no se pueden escribir a tiempo con un enemigo encima.
      if (!cmd || cmd.length > 28 || vistos.has(cmd)) continue;
      vistos.add(cmd);
      salida.push(cmd);
    }
  }
  return salida;
}

/**
 * Comandos del capítulo, sacados del banco de preguntas de esa familia.
 *
 * Los temas finales tienen pocos comandos propios -«servicios» son tres- y con
 * dieciséis enemigos saldrían repetidos todo el rato. Por eso se añaden los de
 * los capítulos anteriores como repaso: da variedad y encaja con la idea del
 * modo historia, que es ir acumulando lo aprendido.
 */
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

/** Cuántas veces sale un comando del propio capítulo frente a uno de repaso. */
export const OWN_SHARE = 0.7;

/** Barajado estable que no depende de dónde se llame. */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Velocidad base de los enemigos, en porcentaje de ancho por segundo. */
export const SPEED: Record<Difficulty, number> = { easy: 3.4, medium: 4.6, hard: 6.2 };
/** Segundos entre apariciones. */
export const SPAWN: Record<Difficulty, number> = { easy: 2.6, medium: 2.1, hard: 1.7 };
