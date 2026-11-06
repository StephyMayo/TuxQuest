import { MISSION_SIZE, TOPICS } from "@/data/catalog";
import { shuffled } from "./shuffle";
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

export type RunMode = "mission" | "story";

export interface ProgressRow extends MissionProgress {
  family: string;
  difficulty: string;
  mode: RunMode;
  topic: string;
}

export const missionKey = (family: FamilyId, difficulty: Difficulty, topic: string) => `${family}:${difficulty}:${topic}`;

export const findRun = (rows: ProgressRow[], family: string, difficulty: string, mode: RunMode, topic: string) =>
  rows.find((r) => r.family === family && r.difficulty === difficulty && r.mode === mode && r.topic === topic);

export function poolFor(questions: Question[], family: FamilyId, difficulty: Difficulty) {
  return questions.filter(
    (q) => q.active !== false && q.difficulty === difficulty && (q.familyId === null || q.familyId === family),
  );
}

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

export function pickQuestions(mission: Mission, size = MISSION_SIZE): Question[] {
  const own = shuffled(mission.pool.filter((q) => q.familyId !== null));
  const common = shuffled(mission.pool.filter((q) => q.familyId === null));
  const picked = [...own, ...common].slice(0, size);
  return shuffled(picked).map((q) => (q.options ? { ...q, options: shuffled(q.options) } : q));
}
