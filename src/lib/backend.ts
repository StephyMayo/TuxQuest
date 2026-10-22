import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MISSION_PASS_RATIO, STARTING_COINS } from "@/data/catalog";
import { DEFAULT_LOADOUT, itemById } from "@/data/shop";
import { QUESTION_BANK } from "@/data/questions";
import type { ActiveBoost, Inventory, Loadout, Question, Slot } from "@/data/types";
import type { MissionProgress } from "./missions";
import { sha256Hex } from "./sha256";

export interface Player {
  id: string;
  username: string;
  email: string;
  coins: number;
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
  getProgress(): Promise<Record<string, MissionProgress>>;
  spendCoins(amount: number): Promise<number>;
  finishMission(key: string, correct: number, total: number, coins: number, boost?: ActiveBoost | null): Promise<number>;
  // --- Tienda y perfil ---
  getInventory(): Promise<Inventory>;
  buyItem(itemId: string): Promise<{ coins: number; inventory: Inventory }>;
  equip(slot: Slot, itemId: string): Promise<Loadout>;
  /** Gasta una unidad de un boost durante la partida. Devuelve el inventario actualizado. */
  consumeBoost(itemId: ActiveBoost): Promise<Inventory>;
  /** Cambia el nombre de usuario. Devuelve el nombre ya guardado. */
  setUsername(username: string): Promise<string>;
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
  titulo: string | null;
  marco: string | null;
}

const loadoutOf = (r: ProfileRow): Loadout => ({
  avatar: r.avatar ?? DEFAULT_LOADOUT.avatar,
  titulo: r.titulo ?? DEFAULT_LOADOUT.titulo,
  marco: r.marco ?? DEFAULT_LOADOUT.marco,
});

class SupabaseBackend implements Backend {
  mode = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  private async profile(userId: string, email: string): Promise<Player | null> {
    const { data, error } = await this.db.from("profiles").select("id, username, coins, avatar, titulo, marco").eq("id", userId).single();
    if (error || !data) return null;
    const row = data as ProfileRow;
    return { id: row.id, username: row.username, coins: row.coins, email, loadout: loadoutOf(row) };
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

  async getProgress() {
    const { data, error } = await this.db.from("mission_progress").select("mission_key, best_correct, best_total, completed");
    if (error) throw error;
    return Object.fromEntries(
      data.map((r) => [r.mission_key, { bestCorrect: r.best_correct, bestTotal: r.best_total, completed: r.completed }]),
    );
  }

  async spendCoins(amount: number) {
    const { data, error } = await this.db.rpc("spend_coins", { p_amount: amount });
    if (error) throw new Error(error.message.includes("insuficientes") ? "No tienes monedas suficientes." : error.message);
    return data as number;
  }

  async finishMission(key: string, correct: number, total: number, coins: number, boost: ActiveBoost | null = null) {
    const { data, error } = await this.db.rpc("finish_mission", {
      p_key: key,
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
    return { avatar: row.avatar, titulo: row.titulo, marco: row.marco };
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
}

// ---------------------------------------------------------------------------
// Modo demo: todo se guarda en el navegador (localStorage). Solo para probar sin Supabase.
// ---------------------------------------------------------------------------

interface DemoUser extends Player {
  passwordHash: string;
  inventory: Inventory;
}

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
    return { id: u.id, username: u.username, email: u.email, coins: u.coins, loadout: { ...u.loadout } };
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

  async getProgress() {
    const u = this.current();
    return u ? load<Record<string, MissionProgress>>(progressKey(u.id), {}) : {};
  }

  async spendCoins(amount: number) {
    const u = this.mustCurrent();
    if (u.coins < amount) throw new Error("No tienes monedas suficientes.");
    u.coins -= amount;
    this.update(u);
    return u.coins;
  }

  async finishMission(key: string, correct: number, total: number, coins: number, boost: ActiveBoost | null = null) {
    const u = this.mustCurrent();
    const all = await this.getProgress();
    const prev = all[key];
    const better = !prev || correct / total > prev.bestCorrect / prev.bestTotal;
    all[key] = {
      bestCorrect: better ? correct : prev.bestCorrect,
      bestTotal: better ? total : prev.bestTotal,
      completed: (prev?.completed ?? false) || correct / total >= MISSION_PASS_RATIO,
    };
    save(progressKey(u.id), all);
    let payout = coins;
    if (boost === "boost_monedas" && (u.inventory[boost] ?? 0) > 0) {
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
      const done = Object.values(await this.getProgress()).filter((p) => p.completed).length;
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
