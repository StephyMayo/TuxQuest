import type { Inventory, ItemKind, Loadout, ShopItem, Slot } from "./types.ts";

/**
 * Catálogo de la tienda. Los precios también viven en la base de datos
 * (tabla shop_items) porque el servidor nunca confía en el precio que manda
 * el navegador: aquí solo están para pintar la tienda.
 */
export const SHOP_ITEMS: ShopItem[] = [
  // --- Boosts: se gastan al usarlos durante una misión -----------------
  {
    id: "boost_monedas",
    kind: "boost",
    name: "Doble moneda",
    description: "Duplica las monedas que ganes en la misión. Actívalo antes de empezar.",
    price: 25,
    stackable: true,
  },
  {
    id: "boost_tiempo",
    kind: "boost",
    name: "Tiempo extra",
    description: "Suma 15 segundos al reloj del reto actual. Solo sirve en Medio y Difícil.",
    price: 15,
    stackable: true,
  },
  {
    id: "boost_pista",
    kind: "boost",
    name: "Pista gratis",
    description: "Revela la pista de un reto sin pagar monedas, incluso en Difícil.",
    price: 18,
    stackable: true,
  },
  {
    id: "boost_escudo",
    kind: "boost",
    name: "Escudo de Tux",
    description: "Tu siguiente fallo cuenta como acierto. Se gasta al usarse.",
    price: 40,
    stackable: true,
  },

  // --- Avatares --------------------------------------------------------
  { id: "tux", kind: "avatar", name: "Tux clásico", description: "El pingüino de siempre. Lo tienes desde el inicio.", price: 0 },
  { id: "tux_gafas", kind: "avatar", name: "Tux hacker", description: "Con gafas de sol. Porque la terminal es oscura.", price: 60 },
  { id: "tux_ninja", kind: "avatar", name: "Tux ninja", description: "Se mueve entre directorios sin hacer ruido.", price: 120, requires: 3 },
  { id: "tux_rey", kind: "avatar", name: "Tux rey", description: "Corona para quien domina su distribución.", price: 200, requires: 6 },
  { id: "tux_oro", kind: "avatar", name: "Tux dorado", description: "Edición brillante. Pura presunción.", price: 350, requires: 10 },
  { id: "tux_fantasma", kind: "avatar", name: "Tux fantasma", description: "Un proceso en segundo plano que nadie puede matar.", price: 280, requires: 8 },

  // --- Títulos ---------------------------------------------------------
  { id: "titulo_novato", kind: "titulo", name: "Novato", description: "Todos empezamos escribiendo ls.", price: 0 },
  { id: "titulo_shell", kind: "titulo", name: "Aprendiz de shell", description: "Ya no le temes al cursor parpadeante.", price: 40 },
  { id: "titulo_script", kind: "titulo", name: "Script Kiddie", description: "Copias comandos, pero con estilo.", price: 90, requires: 3 },
  { id: "titulo_sysadmin", kind: "titulo", name: "Sysadmin", description: "Los servicios te obedecen.", price: 180, requires: 6 },
  { id: "titulo_kernel", kind: "titulo", name: "Maestro del Kernel", description: "Compilas por diversión.", price: 300, requires: 9 },
  { id: "titulo_root", kind: "titulo", name: "root", description: "Con gran poder viene un gran rm -rf. Úsalo con cuidado.", price: 500, requires: 12 },

  // --- Marcos del perfil ----------------------------------------------
  { id: "marco_base", kind: "marco", name: "Marco estándar", description: "Sobrio y funcional, como Debian.", price: 0 },
  { id: "marco_bronce", kind: "marco", name: "Marco de bronce", description: "Tu primera medalla.", price: 70 },
  { id: "marco_plata", kind: "marco", name: "Marco de plata", description: "Brilla sin exagerar.", price: 150, requires: 4 },
  { id: "marco_oro", kind: "marco", name: "Marco de oro", description: "Para los que terminan el desafío final.", price: 320, requires: 8 },
  { id: "marco_neon", kind: "marco", name: "Marco neón", description: "Estética de terminal a las 3 de la madrugada.", price: 260, requires: 6 },
];

/** Lo que trae puesto un jugador nuevo: lo gratuito. */
export const DEFAULT_LOADOUT: Loadout = { avatar: "tux", titulo: "titulo_novato", marco: "marco_base" };

/** Items gratuitos: se consideran siempre en propiedad, no hace falta comprarlos. */
export const FREE_ITEMS = SHOP_ITEMS.filter((i) => i.price === 0).map((i) => i.id);

export const KIND_LABEL: Record<ItemKind, string> = {
  boost: "Boosts",
  avatar: "Avatares",
  titulo: "Títulos",
  marco: "Marcos",
};

export const KIND_HELP: Record<ItemKind, string> = {
  boost: "Se gastan al usarlos dentro de una misión. Puedes acumular varios.",
  avatar: "El pingüino que te representa en el perfil y la cabecera.",
  titulo: "Aparece debajo de tu nombre de usuario.",
  marco: "Cambia el color del borde de tu tarjeta de perfil.",
};

export const SHOP_ORDER: ItemKind[] = ["boost", "avatar", "titulo", "marco"];

export const itemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id);
export const itemsOfKind = (kind: ItemKind) => SHOP_ITEMS.filter((i) => i.kind === kind);
export const isSlot = (kind: ItemKind): kind is Slot => kind !== "boost";

/** ¿El jugador ya tiene este item? Los gratuitos cuentan como comprados. */
export const owns = (inv: Inventory, id: string) => FREE_ITEMS.includes(id) || (inv[id] ?? 0) > 0;

/** Texto corto del título equipado ("" si lleva el de por defecto). */
export const titleText = (id: string) => itemById(id)?.name ?? "";

/** Colores de cada marco: [borde, resplandor]. */
export const FRAME_STYLE: Record<string, { border: string; glow: string }> = {
  marco_base: { border: "#06030f", glow: "transparent" },
  marco_bronce: { border: "#c87f34", glow: "#c87f3455" },
  marco_plata: { border: "#cfd6e6", glow: "#cfd6e655" },
  marco_oro: { border: "#ffd23f", glow: "#ffd23f66" },
  marco_neon: { border: "#3be8ff", glow: "#3be8ff66" },
};

export const frameStyle = (id: string) => FRAME_STYLE[id] ?? FRAME_STYLE.marco_base;
