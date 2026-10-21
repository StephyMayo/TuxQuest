/**
 * Guías de cada distribución: personajes estilo anime en pixel art que
 * aparecen cuando el jugador falla un reto para explicarle el error.
 * El dibujo se arma en Mascot.tsx a partir de esta paleta.
 */

export type Accessory = "sombrero" | "prendedor";

export interface MascotPalette {
  /** Color principal del cabello. */
  hair: string;
  /** Sombra del cabello, un tono más oscuro. */
  hairDark: string;
  /** Iris de los ojos. */
  iris: string;
  /** Corbata y prendedor: el color de la marca. */
  accent: string;
}

export interface Mascot {
  distroId: string;
  name: string;
  /** Una línea que la describe, se muestra bajo el nombre. */
  role: string;
  palette: MascotPalette;
  accessory: Accessory;
  /** Frases al fallar un reto. */
  miss: string[];
  /** Frases cuando se acaba el tiempo. */
  timeout: string[];
}

/** Ropa común a todas: camisa oscura, falda, medias y tacones. */
export const OUTFIT = {
  shirt: "#32295f",
  shirtLight: "#41367a",
  skirt: "#241d4d",
  stocking: "#1d1740",
  stockingBand: "#4d4480",
};

export const MASCOTS: Mascot[] = [
  {
    distroId: "debian",
    name: "Debi",
    role: "la veterana",
    palette: { hair: "#d70751", hairDark: "#8f0535", iris: "#ff7aa8", accent: "#d70751" },
    accessory: "prendedor",
    miss: [
      "Tranquila, esto lleva años puliéndose. Mira bien:",
      "Casi. En Debian preferimos hacerlo despacio y bien:",
      "No pasa nada, yo también lo tuve que aprender:",
    ],
    timeout: ["Se acabó el tiempo. La estabilidad no se apura, pero el reloj sí:", "Respira. Para la próxima ya lo sabrás:"],
  },
  {
    distroId: "ubuntu",
    name: "Ubu",
    role: "la más amable",
    palette: { hair: "#e95420", hairDark: "#9c3512", iris: "#ffb088", accent: "#e95420" },
    accessory: "prendedor",
    miss: ["¡Ey, casi! Te lo explico sin rodeos:", "Nadie nace sabiendo la terminal. Mira:", "Vamos de nuevo, que para eso estoy:"],
    timeout: ["Se te fue el tiempo. Pero oye, ya casi lo tenías:", "El reloj ganó esta vez. Lee esto y seguimos:"],
  },
  {
    distroId: "mint",
    name: "Minta",
    role: "la paciente",
    palette: { hair: "#86be43", hairDark: "#56802a", iris: "#c6f08a", accent: "#86be43" },
    accessory: "prendedor",
    miss: ["Sin prisa. Te lo dejo clarito:", "Ese no era, pero vas bien. Fíjate:", "Mira, es más sencillo de lo que parece:"],
    timeout: ["Se acabó el tiempo. Tómatelo con calma y lee:", "Tiempo. No te agobies, aquí está la clave:"],
  },
  {
    distroId: "archlinux",
    name: "Archi",
    role: "la exigente",
    palette: { hair: "#1793d1", hairDark: "#0e5c85", iris: "#7fd8ff", accent: "#1793d1" },
    accessory: "prendedor",
    miss: ["Está en el manual, pero te lo resumo:", "Error. En Arch eso se nota rápido:", "Casi. Afina la puntería:"],
    timeout: ["Tiempo fuera. En Arch hay que ser rápida y precisa:", "Se acabó. Memoriza esto:"],
  },
  {
    distroId: "cachyos",
    name: "Cachy",
    role: "la veloz",
    palette: { hair: "#00bcd4", hairDark: "#00798a", iris: "#8ef0ff", accent: "#00bcd4" },
    accessory: "prendedor",
    miss: ["Rápido no es lo mismo que correcto. Mira:", "Fallaste, pero se arregla en un segundo:", "Casi lo tenías. Ajusta esto:"],
    timeout: ["¡Demasiado lento! Aquí va la respuesta:", "Tiempo. Optimiza también tus dedos:"],
  },
  {
    distroId: "manjaro",
    name: "Manju",
    role: "la práctica",
    palette: { hair: "#35bf5c", hairDark: "#1f7a39", iris: "#9bf0b4", accent: "#35bf5c" },
    accessory: "prendedor",
    miss: ["Te lo pongo fácil, como hacemos aquí:", "Ese no. Pero mira qué simple es:", "Casi. La versión corta:"],
    timeout: ["Se acabó el tiempo. Te la dejo servida:", "Tiempo fuera. Apúntatelo:"],
  },
  {
    distroId: "endeavouros",
    name: "Endea",
    role: "la aventurera",
    palette: { hair: "#a05ce0", hairDark: "#6b2ea8", iris: "#d9b3ff", accent: "#7b3fb5" },
    accessory: "prendedor",
    miss: ["Toda expedición tiene tropiezos. Mira el mapa:", "Por ahí no era. Vamos por aquí:", "Casi llegabas. Te oriento:"],
    timeout: ["El tiempo se agotó en la travesía:", "Tiempo. La ruta correcta era esta:"],
  },
  {
    distroId: "fedora",
    name: "Fedo",
    role: "la innovadora",
    palette: { hair: "#51a2da", hairDark: "#2a6b99", iris: "#b3e0ff", accent: "#51a2da" },
    accessory: "sombrero",
    miss: ["Siempre probando cosas nuevas, ¿no? Mira:", "Ese fallo me gusta: así se aprende:", "Casi. Lo último que necesitas saber:"],
    timeout: ["Tiempo. Lo nuevo también exige rapidez:", "Se acabó. Quédate con esto:"],
  },
  {
    distroId: "rocky",
    name: "Rocki",
    role: "la firme",
    palette: { hair: "#10b981", hairDark: "#0a7554", iris: "#8affd6", accent: "#10b981" },
    accessory: "sombrero",
    miss: ["En un servidor eso se nota. Fíjate bien:", "Firme y de nuevo. Mira:", "Casi. Aquí no se improvisa:"],
    timeout: ["Tiempo fuera. En producción no hay segundas:", "Se acabó. Grábatelo:"],
  },
  {
    distroId: "alma",
    name: "Alma",
    role: "la confiable",
    palette: { hair: "#4a90c4", hairDark: "#2a5c82", iris: "#a8d8ff", accent: "#2f7fb5" },
    accessory: "sombrero",
    miss: ["Sin dramas, para eso estoy. Mira:", "Ese no era. Te lo explico:", "Casi lo logras. Atenta:"],
    timeout: ["Tiempo. Nada grave, lee esto:", "Se acabó el reloj. La respuesta:"],
  },
  {
    distroId: "tumbleweed",
    name: "Tumble",
    role: "la inquieta",
    palette: { hair: "#30ba78", hairDark: "#1d7a4d", iris: "#9cf5c8", accent: "#30ba78" },
    accessory: "prendedor",
    miss: ["Todo cambia menos esto. Apúntalo:", "Ese no. Aquí va lo que vale siempre:", "Casi. Mira bien:"],
    timeout: ["Tiempo. Rodando se aprende:", "Se acabó. Quédate con esto:"],
  },
  {
    distroId: "leap",
    name: "Leap",
    role: "la estable",
    palette: { hair: "#73ba25", hairDark: "#497a13", iris: "#c4f08a", accent: "#73ba25" },
    accessory: "prendedor",
    miss: ["Un paso a la vez. Mira este:", "Ese no era. Sin saltarse pasos:", "Casi. Lo que faltaba:"],
    timeout: ["Tiempo fuera. Ve paso a paso:", "Se acabó. Repasa esto:"],
  },
];

const BY_ID = new Map(MASCOTS.map((m) => [m.distroId, m]));

/** Mascota de una distribución. Si no hay, usa la primera (Debi). */
export const mascotFor = (distroId: string): Mascot => BY_ID.get(distroId) ?? MASCOTS[0];

/**
 * Elige una frase de forma estable: con el mismo índice sale la misma frase,
 * así el texto no cambia entre el servidor y el navegador.
 */
export const phraseFor = (m: Mascot, timedOut: boolean, seed: number) => {
  const list = timedOut ? m.timeout : m.miss;
  return list[Math.abs(seed) % list.length];
};
