"use client";

import { useSearchParams } from "next/navigation";
import { difficultyById, distrosOf, familyById } from "@/data/catalog";

export function useGameParams() {
  const params = useSearchParams();
  const family = familyById(params.get("familia") ?? "");
  const difficulty = difficultyById(params.get("dificultad") ?? "");
  const distro = family ? distrosOf(family.id)[0] : undefined;
  const valid = !!family && !!difficulty && !!distro;
  const query = valid ? `familia=${family.id}&dificultad=${difficulty.id}` : "";
  return { family, distro, difficulty, valid, query, mission: params.get("mision") };
}
