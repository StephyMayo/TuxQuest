/**
 * Guías de cada familia de distribuciones. Aparecen al fallar un reto para
 * explicar el error con sus propias palabras.
 *
 * Los retratos están en `public/guias/` como imágenes pixel art, una por
 * familia: cada distribución usa la guía de la suya.
 */
import type { FamilyId } from "./types.ts";

export interface Guide {
  familyId: FamilyId;
  name: string;
  /** Una línea que la describe, se muestra bajo el nombre. */
  role: string;
  /** Color de la marca, para el nombre y el texto del bocadillo. */
  color: string;
  /** Tamaño del retrato de busto, para reservar el hueco y evitar saltos. */
  bust: { w: number; h: number };
  /** Frases al fallar un reto. */
  miss: string[];
  /** Frases cuando se acaba el tiempo. */
  timeout: string[];
}

export const GUIDES: Guide[] = [
  {
    familyId: "debian",
    name: "Debi",
    role: "lo estable, paso a paso",
    color: "#7aa8ff",
    bust: { w: 320, h: 409 },
    miss: [
      "Tranquila, esto lleva años puliéndose. Mira bien:",
      "Casi. En Debian preferimos hacerlo despacio y bien:",
      "No pasa nada, yo también lo tuve que aprender:",
    ],
    timeout: [
      "Se acabó el tiempo. La estabilidad no se apura, pero el reloj sí:",
      "Respira. Para la próxima ya lo sabrás:",
    ],
  },
  {
    familyId: "arch",
    name: "Archel",
    role: "siempre a la última",
    color: "#5fc7f5",
    bust: { w: 320, h: 360 },
    miss: [
      "Está en el manual, pero te lo resumo:",
      "Error. En Arch eso se nota rápido:",
      "Casi. Afina la puntería:",
    ],
    timeout: ["Tiempo fuera. En Arch hay que ser rápido y preciso:", "Se acabó. Memoriza esto:"],
  },
  {
    familyId: "redhat",
    name: "Red",
    role: "firmeza de servidor",
    color: "#ff7a7a",
    bust: { w: 320, h: 400 },
    miss: [
      "En un servidor eso se nota. Fíjate bien:",
      "Ese fallo me gusta: así se aprende:",
      "Casi. Aquí no se improvisa:",
    ],
    timeout: ["Tiempo fuera. En producción no hay segundas:", "Se acabó el reloj. Grábatelo:"],
  },
  {
    familyId: "suse",
    name: "Susie",
    role: "el camaleón del equipo",
    color: "#6ee7a8",
    bust: { w: 320, h: 338 },
    miss: [
      "Todo cambia menos esto. Apúntalo:",
      "Ese no era, pero vas bien. Fíjate:",
      "Mira, es más sencillo de lo que parece:",
    ],
    timeout: ["Tiempo. Rodando se aprende:", "Se acabó. Quédate con esto:"],
  },
];

const BY_FAMILY = new Map(GUIDES.map((g) => [g.familyId, g]));

/** Guía de una familia. Si no hay, usa la de Debian. */
export const guideFor = (familyId: string): Guide => BY_FAMILY.get(familyId as FamilyId) ?? GUIDES[0];

/**
 * Elige una frase de forma estable: con el mismo índice sale la misma frase,
 * así el texto no cambia entre el servidor y el navegador.
 */
export const phraseFor = (g: Guide, timedOut: boolean, seed: number) => {
  const list = timedOut ? g.timeout : g.miss;
  return list[Math.abs(seed) % list.length];
};
