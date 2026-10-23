import { MISSION_SIZE, TOPICS } from "@/data/catalog";
import type { Difficulty, FamilyId, Question, Topic } from "@/data/types";

export interface Mission {
  key: string;
  topic: Topic | "final";
  title: string;
  description: string;
  pool: Question[];
}

export interface MissionProgress {
  bestCorrect: number;
  bestTotal: number;
  completed: boolean;
}

/** De dónde viene una partida guardada: una misión suelta o un capítulo. */
export type RunMode = "mission" | "story";

/**
 * Una fila de progreso. La familia y la dificultad son campos propios, no
 * trozos de un texto: así el progreso de cada familia se guarda aparte y no
 * se pisa al cambiar de una a otra.
 */
export interface ProgressRow extends MissionProgress {
  family: string;
  difficulty: string;
  mode: RunMode;
  topic: string;
}

/** Identificador de la misión dentro de su familia y dificultad. */
export const missionKey = (family: FamilyId, difficulty: Difficulty, topic: string) => `${family}:${difficulty}:${topic}`;

/** Busca una fila concreta dentro de todo el progreso del jugador. */
export const findRun = (rows: ProgressRow[], family: string, difficulty: string, mode: RunMode, topic: string) =>
  rows.find((r) => r.family === family && r.difficulty === difficulty && r.mode === mode && r.topic === topic);

/** Filas de una familia y dificultad concretas. */
export const runsOf = (rows: ProgressRow[], family: string, difficulty: string, mode: RunMode) =>
  rows.filter((r) => r.family === family && r.difficulty === difficulty && r.mode === mode);

/**
 * Preguntas disponibles para una familia y dificultad: las comunes más las
 * de esa familia, incluidas las que son de una distribución concreta suya.
 */
export function poolFor(questions: Question[], family: FamilyId, difficulty: Difficulty) {
  return questions.filter(
    (q) => q.active !== false && q.difficulty === difficulty && (q.familyId === null || q.familyId === family),
  );
}

/** Lista de misiones (RF-06): una por tema con al menos 3 preguntas, más un desafío final con todo. */
export function missionsFor(questions: Question[], family: FamilyId, difficulty: Difficulty): Mission[] {
  const pool = poolFor(questions, family, difficulty);
  const byTopic = new Map<Topic, Question[]>();
  for (const q of pool) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);

  const missions: Mission[] = [...byTopic.entries()]
    .filter(([, qs]) => qs.length >= 3)
    .sort(([a], [b]) => TOPICS[a].order - TOPICS[b].order)
    .map(([topic, qs]) => ({
      key: missionKey(family, difficulty, topic),
      topic,
      title: TOPICS[topic].title,
      description: TOPICS[topic].description,
      pool: qs,
    }));

  if (pool.length) {
    missions.push({
      key: missionKey(family, difficulty, "final"),
      topic: "final",
      title: "Desafío final",
      description: "Preguntas de todos los temas mezcladas.",
      pool,
    });
  }
  return missions;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Elige las preguntas de una partida: primero las propias de la familia, luego las comunes. */
export function pickQuestions(mission: Mission, size = MISSION_SIZE): Question[] {
  const own = shuffle(mission.pool.filter((q) => q.familyId !== null));
  const common = shuffle(mission.pool.filter((q) => q.familyId === null));
  const picked = [...own, ...common].slice(0, size);
  return shuffle(picked).map((q) => (q.options ? { ...q, options: shuffle(q.options) } : q));
}
