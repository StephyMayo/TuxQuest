export type FamilyId = "debian" | "arch" | "redhat" | "suse";
export type Difficulty = "facil" | "medio" | "dificil";
export type ChallengeType = "write" | "choice" | "complete" | "fix";
export type Topic =
  | "navegacion"
  | "archivos"
  | "permisos"
  | "busqueda"
  | "paquetes"
  | "procesos"
  | "servicios"
  | "redes"
  | "sistema";

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
