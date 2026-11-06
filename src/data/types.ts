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

  familyId: FamilyId | null;

  distroId: string | null;
  difficulty: Difficulty;
  type: ChallengeType;
  topic: Topic;
  prompt: string;

  answers: string[];
  options?: string[];

  template?: string;

  broken?: string;
  hint: string;
  explanation: string;

  cwd?: string;
  active?: boolean;
}

export interface DifficultyRules {
  id: Difficulty;
  name: string;
  types: ChallengeType[];
  seconds: number | null;
  hintCost: number | null;
  coins: number;
  commands: string;
}

export type Slot = "avatar" | "title" | "frame";
export type ItemKind = Slot | "boost";

export interface ShopItem {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  price: number;

  stackable?: boolean;

  requires?: number;

  image?: { src: string; w: number; h: number };
}

export type Inventory = Record<string, number>;

export interface Loadout {
  avatar: string;
  title: string;
  frame: string;
}

export type ActiveBoost = "boost_coins" | "boost_time" | "boost_hint" | "boost_shield";
