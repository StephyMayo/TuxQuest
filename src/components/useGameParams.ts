"use client";

import { useSearchParams } from "next/navigation";
import { difficultyById, distrosOf, familyById } from "@/data/catalog";

/**
 * Lee y valida familia y dificultad de la URL.
 *
 * La distribución ya no se elige: la terminal necesita una concreta para el
 * prompt, así que se usa la primera de la familia, que es la de referencia
 * (Debian, Arch Linux, Fedora, Tumbleweed). Las preguntas salen de toda la
 * familia, no solo de esa distribución.
 */
export function useGameParams() {
  const params = useSearchParams();
  const family = familyById(params.get("familia") ?? "");
  const difficulty = difficultyById(params.get("dificultad") ?? "");
  const distro = family ? distrosOf(family.id)[0] : undefined;
  const valid = !!family && !!difficulty && !!distro;
  const query = valid ? `familia=${family.id}&dificultad=${difficulty.id}` : "";
  return { family, distro, difficulty, valid, query, mission: params.get("mision") };
}
