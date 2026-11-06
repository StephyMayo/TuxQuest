import type { Chapter } from "@/data/story";
import type { DifficultyRules, Family, Question } from "@/data/types";

export interface GameProps {
  chapter: Chapter;
  family: Family;
  rules: DifficultyRules;

  questions: Question[];

  onFinish: (score: number, total: number) => void;
}
