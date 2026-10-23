export type FamilyId = "debian" | "arch" | "redhat" | "suse";
export type Difficulty = "easy" | "medium" | "hard";
export type ChallengeType = "write" | "choice" | "complete" | "fix";
export type Topic =
  | "navigation"
  | "files"
  | "permissions"
  | "search"
  | "packages"
  | "processes"
  | "services"
  | "network"
  | "system";

export interface Family {
  id: FamilyId;
  name: string;
  packageManager: string;
  example: string;
  color: string;
  description: string;
}

export interface Distro {
  id: string;
  familyId: FamilyId;
  name: string;
  hostname: string;
  description: string;
}

export interface Question {
  id: string;
  /** null = comando común a todas las familias */
  familyId: FamilyId | null;
  /** null = sirve para todas las distribuciones de la familia */
  distroId: string | null;
  difficulty: Difficulty;
  type: ChallengeType;
  topic: Topic;
  prompt: string;
  /** Respuestas aceptadas. En "choice" es el texto de la opción correcta; en "complete" es lo que va en el hueco. */
  answers: string[];
  options?: string[];
  /** Plantilla con "___" para el reto "complete" */
  template?: string;
  /** Comando con error para el reto "fix" */
  broken?: string;
  hint: string;
  explanation: string;
  /** Carpeta donde empieza la terminal para esta pregunta (por defecto ~) */
  cwd?: string;
  active?: boolean;
}

export interface DifficultyRules {
  id: Difficulty;
  name: string;
  types: ChallengeType[];
  seconds: number | null;
  hintCost: number | null; // 0 = gratis, null = sin pistas
  coins: number;
  commands: string;
}

// ---------------------------------------------------------------------------
// Tienda y personalización
// ---------------------------------------------------------------------------

/** Ranura de personalización del perfil (un item equipado por ranura). */
export type Slot = "avatar" | "title" | "frame";
export type ItemKind = Slot | "boost";

export interface ShopItem {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  price: number;
  /** Los boosts se gastan al usarlos, así que se pueden comprar varias veces. */
  stackable?: boolean;
  /** Misiones completadas que hacen falta para poder comprarlo. */
  requires?: number;
  /**
   * Avatares dibujados como imagen en vez de sprite de píxeles.
   * El tamaño sirve para reservar el hueco y evitar saltos al cargar.
   */
  image?: { src: string; w: number; h: number };
}

/** Cuántas unidades tiene el jugador de cada item. Los cosméticos valen 1. */
export type Inventory = Record<string, number>;

/** Lo que el jugador lleva puesto. */
export interface Loadout {
  avatar: string;
  title: string;
  frame: string;
}

/** Boost activado para la partida en curso. */
export type ActiveBoost = "boost_coins" | "boost_time" | "boost_hint" | "boost_shield";
