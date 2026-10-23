import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MISSION_PASS_RATIO, STARTING_COINS } from "@/data/catalog";
import { DEFAULT_LOADOUT, itemById } from "@/data/shop";
import { QUESTION_BANK } from "@/data/questions";
import type { ActiveBoost, Inventory, Loadout, Question, Slot } from "@/data/types";
import type { MissionProgress, ProgressRow, RunMode } from "./missions";
import { sha256Hex } from "./sha256";

export interface Player {
  id: string;
  username: string;
  email: string;
  coins: number;
  /** Familia elegida a mano. null = se deduce de las misiones superadas. */
  family: string | null;
  /** Lo que lleva puesto: avatar, título y marco. */
  loadout: Loadout;
}

export interface Backend {
  mode: "supabase" | "demo";
  getPlayer(): Promise<Player | null>;
  /** Devuelve null si hay que confirmar el correo antes de entrar. */
  signUp(username: string, email: string, password: string): Promise<Player | null>;
  signIn(email: string, password: string): Promise<Player>;
  signOut(): Promise<void>;
  getQuestions(): Promise<Question[]>;
  /** Todo el progreso del jugador, una fila por familia, dificultad y tema. */
  getProgress(): Promise<ProgressRow[]>;
  spendCoins(amount: number): Promise<number>;
  /** Guarda una partida terminada, sea una misión o un capítulo de historia. */
  finishRun(
    family: string,
    difficulty: string,
    mode: RunMode,
    topic: string,
    correct: number,
    total: number,
    coins: number,
    boost?: ActiveBoost | null,
  ): Promise<number>;
  // --- Tienda y perfil ---
  getInventory(): Promise<Inventory>;
  buyItem(itemId: string): Promise<{ coins: number; inventory: Inventory }>;
  equip(slot: Slot, itemId: string): Promise<Loadout>;
  /** Gasta una unidad de un boost durante la partida. Devuelve el inventario actualizado. */
  consumeBoost(itemId: ActiveBoost): Promise<Inventory>;
  /** Cambia el nombre de usuario. Devuelve el nombre ya guardado. */
  setUsername(username: string): Promise<string>;
  /** Fija la familia del perfil. null deja que se deduzca de lo jugado. */
  setFamily(family: string | null): Promise<string | null>;
  /**
   * Pide el cambio de correo. Devuelve true si el cambio quedó hecho y false
   * si hace falta confirmarlo desde el correo nuevo, que es lo normal.
   */
  setEmail(email: string): Promise<boolean>;
}

/** Reglas del nombre de usuario, las mismas que valida la base de datos. */
export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const USERNAME_HELP = "De 3 a 20 caracteres: letras, números o guion bajo.";

export class AuthError extends Error {}
export class ShopError extends Error {}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

interface QuestionRow {
  id: string;
  family_id: Question["familyId"];
  distro_id: string | null;
  difficulty: Question["difficulty"];
  type: Question["type"];
  topic: Question["topic"];
  prompt: string;
  answers: string[];
  options: string[] | null;
  template: string | null;
  broken: string | null;
  hint: string;
  explanation: string;
  cwd: string | null;
  active: boolean;
}

const fromRow = (r: QuestionRow): Question => ({
  id: r.id,
  familyId: r.family_id,
  distroId: r.distro_id,
  difficulty: r.difficulty,
  type: r.type,
  topic: r.topic,
  prompt: r.prompt,
  answers: r.answers,
  ...(r.options ? { options: r.options } : {}),
  ...(r.template ? { template: r.template } : {}),
  ...(r.broken ? { broken: r.broken } : {}),
  ...(r.cwd ? { cwd: r.cwd } : {}),
  hint: r.hint,
  explanation: r.explanation,
  active: r.active,
});

const AUTH_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese correo.",
  "Email not confirmed": "Primero confirma tu correo con el enlace que te enviamos.",
};

/** Mensajes que Supabase devuelve con texto variable: se buscan por fragmento. */
const AUTH_PATTERNS: [RegExp, string][] = [
  [
    /email rate limit|over_email_send_rate_limit|rate limit exceeded/i,
    "Se alcanzó el límite de correos de registro. Espera unos minutos e inténtalo de nuevo, o pide al administrador que configure el envío de correos.",
  ],
  [/for security purposes|only request this after/i, "Espera unos segundos antes de volver a intentarlo."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/signups not allowed|signup is disabled/i, "El registro de cuentas nuevas está desactivado."],
];

const authMessage = (m: string) => AUTH_MESSAGES[m] ?? AUTH_PATTERNS.find(([re]) => re.test(m))?.[1] ?? m;

/** Traduce los errores que lanzan las funciones de la tienda. */
function shopMessage(m: string) {
  if (/nombre no valido/i.test(m)) return USERNAME_HELP;
  if (/nombre en uso/i.test(m)) return "Ese nombre de usuario ya está en uso.";
  if (/familia no valida/i.test(m)) return "Esa familia no existe.";
  if (/email address.*invalid|invalid email/i.test(m)) return "Ese correo no es válido.";
  if (/already registered|already been registered/i.test(m)) return "Ya hay una cuenta con ese correo.";
  if (/rate limit|for security purposes/i.test(m))
    return "Se alcanzó el límite de correos. Espera unos minutos e inténtalo de nuevo.";
  if (/monedas insuficientes/i.test(m)) return "No tienes monedas suficientes.";
  if (/ya tienes/i.test(m)) return "Ya tienes ese objeto.";
  if (/no disponible|no existe/i.test(m)) return "Ese objeto ya no está disponible.";
  if (/bloqueado/i.test(m)) return "Todavía no has desbloqueado ese objeto.";
  if (/sin unidades/i.test(m)) return "No te quedan unidades de ese boost.";
  return m;
}

interface ProfileRow {
  id: string;
  username: string;
  coins: number;
  avatar: string | null;
  title: string | null;
  frame: string | null;
  family_id: string | null;
}

const loadoutOf = (r: ProfileRow): Loadout => ({
  avatar: r.avatar ?? DEFAULT_LOADOUT.avatar,
  title: r.title ?? DEFAULT_LOADOUT.title,
  frame: r.frame ?? DEFAULT_LOADOUT.frame,
});

class SupabaseBackend implements Backend {
  mode = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  private async profile(userId: string, email: string): Promise<Player | null> {
    const { data, error } = await this.db.from("profiles").select("id, username, coins, avatar, title, frame, family_id").eq("id", userId).single();
    if (error || !data) return null;
    const row = data as ProfileRow;
    return { id: row.id, username: row.username, coins: row.coins, email, family: row.family_id, loadout: loadoutOf(row) };
  }

  async getPlayer() {
    const { data } = await this.db.auth.getSession();
    const user = data.session?.user;
    return user ? this.profile(user.id, user.email ?? "") : null;
  }

  async signUp(username: string, email: string, password: string) {
    const { data: taken } = await this.db.rpc("username_taken", { p_username: username });
    if (taken) throw new AuthError("Ese nombre de usuario ya está en uso.");
    const { data, error } = await this.db.auth.signUp({ email, password, options: { data: { username } } });
    if (error) throw new AuthError(authMessage(error.message));
    if (!data.session || !data.user) return null;
    return this.profile(data.user.id, email);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new AuthError(authMessage(error.message));
    const p = await this.profile(data.user.id, email);
    if (!p) throw new AuthError("No se encontró el perfil del jugador.");
    return p;
  }

  async signOut() {
    await this.db.auth.signOut();
  }

  async getQuestions() {
    const { data, error } = await this.db.from("questions").select("*").eq("active", true);
    if (error) throw error;
    return (data as QuestionRow[]).map(fromRow);
  }

  async getProgress(): Promise<ProgressRow[]> {
    const { data, error } = await this.db
      .from("family_progress")
      .select("family_id, difficulty, mode, topic, best_correct, best_total, completed");
    if (error) throw error;
    return data.map((r) => ({
      family: r.family_id as string,
      difficulty: r.difficulty as string,
      mode: r.mode as RunMode,
      topic: r.topic as string,
      bestCorrect: r.best_correct as number,
      bestTotal: r.best_total as number,
      completed: r.completed as boolean,
    }));
  }

  async spendCoins(amount: number) {
    const { data, error } = await this.db.rpc("spend_coins", { p_amount: amount });
    if (error) throw new Error(error.message.includes("insuficientes") ? "No tienes monedas suficientes." : error.message);
    return data as number;
  }

  async finishRun(
    family: string,
    difficulty: string,
    mode: RunMode,
    topic: string,
    correct: number,
    total: number,
    coins: number,
    boost: ActiveBoost | null = null,
  ) {
    const { data, error } = await this.db.rpc("finish_run", {
      p_family: family,
      p_difficulty: difficulty,
      p_mode: mode,
      p_topic: topic,
      p_correct: correct,
      p_total: total,
      p_coins: coins,
      p_boost: boost,
    });
    if (error) throw error;
    return data as number;
  }

  async getInventory() {
    const { data, error } = await this.db.from("inventory").select("item_id, qty");
    if (error) throw error;
    return Object.fromEntries(data.map((r) => [r.item_id as string, r.qty as number])) as Inventory;
  }

  async buyItem(itemId: string) {
    const { data, error } = await this.db.rpc("buy_item", { p_item_id: itemId });
    if (error) throw new ShopError(shopMessage(error.message));
    return { coins: data as number, inventory: await this.getInventory() };
  }

  async equip(slot: Slot, itemId: string) {
    const { data, error } = await this.db.rpc("equip_item", { p_slot: slot, p_item_id: itemId });
    if (error) throw new ShopError(shopMessage(error.message));
    const row = data as Loadout;
    return { avatar: row.avatar, title: row.title, frame: row.frame };
  }

  async consumeBoost(itemId: ActiveBoost) {
    const { error } = await this.db.rpc("consume_boost", { p_item_id: itemId });
    if (error) throw new ShopError(shopMessage(error.message));
    return this.getInventory();
  }

  async setUsername(username: string) {
    const { data, error } = await this.db.rpc("set_username", { p_username: username });
    if (error) throw new ShopError(shopMessage(error.message));
    return data as string;
  }

  async setFamily(family: string | null) {
    const { data, error } = await this.db.rpc("set_family", { p_family: family });
    if (error) throw new ShopError(shopMessage(error.message));
    return (data as string | null) ?? null;
  }

  async setEmail(email: string) {
    const { data, error } = await this.db.auth.updateUser({ email });
    if (error) throw new ShopError(shopMessage(error.message));
    // Supabase manda un correo de confirmación a la dirección nueva; hasta
    // que no se pulse el enlace, la cuenta sigue con la anterior.
    return data.user?.email?.toLowerCase() === email.trim().toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// Modo demo: todo se guarda en el navegador (localStorage). Solo para probar sin Supabase.
// ---------------------------------------------------------------------------

interface DemoUser extends Player {
  passwordHash: string;
  inventory: Inventory;
}

/** Valores que usaba la versión en castellano, para traducir lo guardado. */
const OLD_DIFFICULTY: Record<string, string> = { facil: "easy", medio: "medium", dificil: "hard" };
const OLD_TOPIC: Record<string, string> = {
  navegacion: "navigation",
  archivos: "files",
  paquetes: "packages",
  permisos: "permissions",
  busqueda: "search",
  sistema: "system",
  procesos: "processes",
  servicios: "services",
  redes: "network",
};

const USERS = "tuxquest.users";
const SESSION = "tuxquest.session";
const progressKey = (id: string) => `tuxquest.progress.${id}`;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

async function sha256(text: string) {
  // crypto.subtle solo existe en contextos seguros (https o localhost)
  if (!globalThis.crypto?.subtle) return sha256Hex(text);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const newId = () => (typeof globalThis.crypto?.randomUUID === "function" && globalThis.isSecureContext ? crypto.randomUUID() : `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/** Cuenta de prueba disponible en modo demo. */
export const DEMO_ACCOUNT = { email: "demo@tuxquest.pe", password: "tux12345", username: "tux_demo" };
const DEMO_USER: DemoUser = {
  id: "demo-tux",
  username: DEMO_ACCOUNT.username,
  email: DEMO_ACCOUNT.email,
  coins: 100,
  family: null,
  loadout: { ...DEFAULT_LOADOUT },
  inventory: {},
  passwordHash: "77f452e816a4198332b907a57e18b6c303d47d35d4b12a43ad4f4ea74311f2b4", // sha256("tux12345")
};

class DemoBackend implements Backend {
  mode = "demo" as const;

  private users() {
    const users = load<Record<string, DemoUser>>(USERS, {});
    const all = users[DEMO_USER.email] ? users : { ...users, [DEMO_USER.email]: DEMO_USER };
    // Las cuentas creadas antes de la tienda no traen estos campos
    for (const u of Object.values(all)) {
      u.loadout ??= { ...DEFAULT_LOADOUT };
      u.inventory ??= {};
      u.family ??= null;
    }
    return all;
  }
  private current(): DemoUser | null {
    const id = load<string | null>(SESSION, null);
    return Object.values(this.users()).find((u) => u.id === id) ?? null;
  }
  private update(user: DemoUser) {
    save(USERS, { ...this.users(), [user.email]: user });
  }
  private mustCurrent(): DemoUser {
    const u = this.current();
    if (!u) throw new ShopError("Sesión no iniciada.");
    return u;
  }
  private toPlayer(u: DemoUser): Player {
    return { id: u.id, username: u.username, email: u.email, coins: u.coins, family: u.family, loadout: { ...u.loadout } };
  }

  async getPlayer() {
    const u = this.current();
    return u ? this.toPlayer(u) : null;
  }

  async signUp(username: string, email: string, password: string) {
    const users = this.users();
    const mail = email.toLowerCase();
    if (users[mail]) throw new AuthError("Ya existe una cuenta con ese correo.");
    if (Object.values(users).some((u) => u.username.toLowerCase() === username.toLowerCase()))
      throw new AuthError("Ese nombre de usuario ya está en uso.");
    const user: DemoUser = {
      id: newId(),
      username,
      email: mail,
      coins: STARTING_COINS,
      family: null,
      loadout: { ...DEFAULT_LOADOUT },
      inventory: {},
      passwordHash: await sha256(password),
    };
    this.update(user);
    save(SESSION, user.id);
    return this.toPlayer(user);
  }

  async signIn(email: string, password: string) {
    const user = this.users()[email.toLowerCase()];
    if (!user || user.passwordHash !== (await sha256(password))) throw new AuthError("Correo o contraseña incorrectos.");
    save(SESSION, user.id);
    return this.toPlayer(user);
  }

  async signOut() {
    try {
      localStorage.removeItem(SESSION);
    } catch {
      /* nada */
    }
  }

  async getQuestions() {
    return QUESTION_BANK;
  }

  async getProgress(): Promise<ProgressRow[]> {
    const u = this.current();
    if (!u) return [];
    const guardado = load<ProgressRow[] | Record<string, MissionProgress>>(progressKey(u.id), []);
    if (Array.isArray(guardado)) return guardado;
    // Partidas guardadas con el formato viejo, "familia:dificultad:tema".
    // Las del modo historia iban como "historia:<tema>", sin familia, así
    // que no hay de dónde sacarla y se descartan.
    //
    // La dificultad y el tema venían en castellano, así que además de
    // repartir la clave hay que traducirlos: si no, esas filas no
    // encajarían nunca con lo que pide el juego.
    const migrado: ProgressRow[] = [];
    for (const [clave, v] of Object.entries(guardado)) {
      const [family, dif, tema] = clave.split(":");
      if (!tema || !["debian", "arch", "redhat", "suse"].includes(family)) continue;
      const difficulty = OLD_DIFFICULTY[dif] ?? dif;
      const topic = OLD_TOPIC[tema] ?? tema;
      migrado.push({ family, difficulty, mode: "mission", topic, ...v });
    }
    save(progressKey(u.id), migrado);
    return migrado;
  }

  async spendCoins(amount: number) {
    const u = this.mustCurrent();
    if (u.coins < amount) throw new Error("No tienes monedas suficientes.");
    u.coins -= amount;
    this.update(u);
    return u.coins;
  }

  async finishRun(
    family: string,
    difficulty: string,
    mode: RunMode,
    topic: string,
    correct: number,
    total: number,
    coins: number,
    boost: ActiveBoost | null = null,
  ) {
    const u = this.mustCurrent();
    const all = await this.getProgress();
    const i = all.findIndex((r) => r.family === family && r.difficulty === difficulty && r.mode === mode && r.topic === topic);
    const prev = i >= 0 ? all[i] : null;
    const mejor = !prev || correct / total > prev.bestCorrect / prev.bestTotal;
    const fila: ProgressRow = {
      family,
      difficulty,
      mode,
      topic,
      bestCorrect: mejor ? correct : prev!.bestCorrect,
      bestTotal: mejor ? total : prev!.bestTotal,
      completed: (prev?.completed ?? false) || correct / total >= MISSION_PASS_RATIO,
    };
    if (i >= 0) all[i] = fila;
    else all.push(fila);
    save(progressKey(u.id), all);
    let payout = coins;
    if (boost === "boost_coins" && (u.inventory[boost] ?? 0) > 0) {
      u.inventory[boost] -= 1;
      payout *= 2;
    }
    u.coins += payout;
    this.update(u);
    return u.coins;
  }

  async getInventory() {
    return { ...this.mustCurrent().inventory };
  }

  async buyItem(itemId: string) {
    const u = this.mustCurrent();
    const item = itemById(itemId);
    if (!item) throw new ShopError("Ese objeto ya no está disponible.");
    if (item.requires) {
      const done = (await this.getProgress()).filter((p) => p.completed).length;
      if (done < item.requires) throw new ShopError("Todavía no has desbloqueado ese objeto.");
    }
    if (!item.stackable && (u.inventory[itemId] ?? 0) > 0) throw new ShopError("Ya tienes ese objeto.");
    if (u.coins < item.price) throw new ShopError("No tienes monedas suficientes.");
    u.coins -= item.price;
    u.inventory[itemId] = (u.inventory[itemId] ?? 0) + 1;
    this.update(u);
    return { coins: u.coins, inventory: { ...u.inventory } };
  }

  async equip(slot: Slot, itemId: string) {
    const u = this.mustCurrent();
    const item = itemById(itemId);
    if (!item || item.kind !== slot) throw new ShopError("Ese objeto ya no está disponible.");
    if (item.price > 0 && (u.inventory[itemId] ?? 0) === 0) throw new ShopError("Todavía no has desbloqueado ese objeto.");
    u.loadout = { ...u.loadout, [slot]: itemId };
    this.update(u);
    return { ...u.loadout };
  }

  async consumeBoost(itemId: ActiveBoost) {
    const u = this.mustCurrent();
    if ((u.inventory[itemId] ?? 0) <= 0) throw new ShopError("No te quedan unidades de ese boost.");
    u.inventory[itemId] -= 1;
    this.update(u);
    return { ...u.inventory };
  }

  async setUsername(username: string) {
    const u = this.mustCurrent();
    const nombre = username.trim();
    if (!USERNAME_RE.test(nombre)) throw new ShopError(USERNAME_HELP);
    if (Object.values(this.users()).some((o) => o.id !== u.id && o.username.toLowerCase() === nombre.toLowerCase()))
      throw new ShopError("Ese nombre de usuario ya está en uso.");
    u.username = nombre;
    this.update(u);
    return nombre;
  }

  async setFamily(family: string | null) {
    const u = this.mustCurrent();
    if (family !== null && !["debian", "arch", "redhat", "suse"].includes(family))
      throw new ShopError("Esa familia no existe.");
    u.family = family;
    this.update(u);
    return family;
  }

  async setEmail(email: string) {
    const u = this.mustCurrent();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new ShopError("Ese correo no es válido.");
    if (Object.values(this.users()).some((o) => o.id !== u.id && o.email === mail))
      throw new ShopError("Ya hay una cuenta con ese correo.");
    // En demo las cuentas van por correo, así que hay que mover la entrada.
    const users = this.users();
    delete users[u.email];
    u.email = mail;
    save(USERS, { ...users, [mail]: u });
    return true;
  }
}

// ---------------------------------------------------------------------------

let instance: Backend | null = null;

export function getBackend(): Backend {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase llama a la clave pública "publishable key" (antes "anon key"); aceptamos ambos nombres.
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? new SupabaseBackend(createClient(url, key)) : new DemoBackend();
  return instance;
}
