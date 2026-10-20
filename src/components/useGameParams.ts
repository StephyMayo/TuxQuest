"use client";

import { useSearchParams } from "next/navigation";
import { difficultyById, distroById, familyById } from "@/data/catalog";

/** Lee y valida familia, categoría y dificultad de la URL. */
export function useGameParams() {
  const params = useSearchParams();
  const family = familyById(params.get("familia") ?? "");
  const distro = distroById(params.get("categoria") ?? "");
  const difficulty = difficultyById(params.get("dificultad") ?? "");
  const valid = !!family && !!distro && !!difficulty && distro.familyId === family.id;
  const query = valid ? `familia=${family.id}&categoria=${distro.id}&dificultad=${difficulty.id}` : "";
  return { family, distro, difficulty, valid, query, mission: params.get("mision") };
}
