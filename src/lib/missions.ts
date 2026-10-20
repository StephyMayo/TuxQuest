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

export const missionKey = (family: FamilyId, difficulty: Difficulty, topic: string) => `${family}:${difficulty}:${topic}`;

/** Preguntas disponibles para una familia, distribución y dificultad (comunes + de la familia + de la distro). */
export function poolFor(questions: Question[], family: FamilyId, distro: string, difficulty: Difficulty) {
  return questions.filter(
    (q) =>
      q.active !== false &&
      q.difficulty === difficulty &&
      (q.familyId === null || q.familyId === family) &&
      (q.distroId === null || q.distroId === distro),
  );
}

/** Lista de misiones (RF-06): una por tema con al menos 3 preguntas, más un desafío final con todo. */
export function missionsFor(questions: Question[], family: FamilyId, distro: string, difficulty: Difficulty): Mission[] {
  const pool = poolFor(questions, family, distro, difficulty);
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

/** Elige las preguntas de una partida: primero las propias de la distro y la familia, luego las comunes. */
export function pickQuestions(mission: Mission, distro: string, size = MISSION_SIZE): Question[] {
  const own = shuffle(mission.pool.filter((q) => q.distroId === distro));
  const family = shuffle(mission.pool.filter((q) => q.familyId !== null && q.distroId === null));
  const common = shuffle(mission.pool.filter((q) => q.familyId === null));
  const picked = [...own, ...family, ...common].slice(0, size);
  return shuffle(picked).map((q) => (q.options ? { ...q, options: shuffle(q.options) } : q));
}
