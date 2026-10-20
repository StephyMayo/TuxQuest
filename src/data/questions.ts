import { COMMON_EASY, COMMON_HARD, COMMON_MEDIUM } from "./questions-common.ts";
import { PACKAGE_QUESTIONS } from "./questions-packages.ts";
import type { Question } from "./types.ts";

/** Banco de preguntas inicial. En modo Supabase se carga desde la tabla `questions` (ver supabase/seed.sql). */
export const QUESTION_BANK: Question[] = [...COMMON_EASY, ...COMMON_MEDIUM, ...COMMON_HARD, ...PACKAGE_QUESTIONS];
