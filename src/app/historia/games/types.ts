import type { Chapter } from "@/data/story";
import type { DifficultyRules, Family, Question } from "@/data/types";

/** Lo que recibe cualquier minijuego del modo historia. */
export interface GameProps {
  chapter: Chapter;
  family: Family;
  rules: DifficultyRules;
  /** Banco de preguntas ya cargado, sin filtrar. */
  questions: Question[];
  /** Se llama una vez al acabar: aciertos y total posible. */
  onFinish: (score: number, total: number) => void;
}
