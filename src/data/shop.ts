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
  {
    id: "av_tactica",
    kind: "avatar",
    name: "Operadora táctica",
    description: "Sale a campo con el portátil en la mano. Nunca pierde la conexión.",
    price: 400,
    requires: 5,
    image: { src: "/avatares/tactica.png", w: 133, h: 300 },
  },
  {
    id: "av_exploradora",
    kind: "avatar",
    name: "Exploradora",
    description: "Se mueve por el sistema de archivos como por un tejado.",
    price: 480,
    requires: 8,
    image: { src: "/avatares/exploradora.png", w: 171, h: 300 },
  },
  {
    id: "av_infiltrada",
    kind: "avatar",
    name: "Infiltrada",
    description: "Entra, hace su trabajo y no deja ni una línea en los registros.",
    price: 550,
    requires: 12,
    image: { src: "/avatares/infiltrada.png", w: 147, h: 300 },
  },
  {
    id: "av_escudero",
    kind: "avatar",
    name: "Escudero verde",
    description: "Pequeño, con casco y bastón. Todo el mundo empieza así.",
    price: 120,
    image: { src: "/avatares/av_escudero.webp", w: 197, h: 240 },
  },
  {
    id: "av_marine",
    kind: "avatar",
    name: "Marine orbital",
    description: "Armadura blanca y rifle. Despliegue limpio, salida limpia.",
    price: 150,
    image: { src: "/avatares/av_marine.webp", w: 175, h: 240 },
  },
  {
    id: "av_guardia",
    kind: "avatar",
    name: "Guardia dorada",
    description: "De guardia en el puerto 22, turno de noche.",
    price: 170, requires: 1,
    image: { src: "/avatares/av_guardia.webp", w: 165, h: 240 },
  },
  {
    id: "av_automata",
    kind: "avatar",
    name: "Autómata oxidado",
    description: "Lleva décadas funcionando. Nadie recuerda quién lo compiló.",
    price: 200, requires: 2,
    image: { src: "/avatares/av_automata.webp", w: 241, h: 240 },
  },
  {
    id: "av_dagas",
    kind: "avatar",
    name: "Dagas gemelas",
    description: "Dos filos, dos terminales abiertas.",
    price: 220, requires: 3,
    image: { src: "/avatares/av_dagas.webp", w: 172, h: 240 },
  },
  {
    id: "av_orco",
    kind: "avatar",
    name: "Orco martillador",
    description: "Su respuesta a cualquier error es volver a compilar.",
    price: 240, requires: 3,
    image: { src: "/avatares/av_orco.webp", w: 218, h: 240 },
  },
  {
    id: "av_barbaro",
    kind: "avatar",
    name: "Bárbaro del log",
    description: "Lee diez mil líneas de registro sin pestañear.",
    price: 260, requires: 4,
    image: { src: "/avatares/av_barbaro.webp", w: 204, h: 240 },
  },
  {
    id: "av_ninja",
    kind: "avatar",
    name: "Ninja de la red",
    description: "Entra por el puerto que nadie vigila.",
    price: 280, requires: 5,
    image: { src: "/avatares/av_ninja.webp", w: 187, h: 240 },
  },
  {
    id: "av_garras",
    kind: "avatar",
    name: "Garras de plasma",
    description: "Corta procesos colgados de un zarpazo.",
    price: 300, requires: 5,
    image: { src: "/avatares/av_garras.webp", w: 171, h: 240 },
  },
  {
    id: "av_neon",
    kind: "avatar",
    name: "Arquera de neón",
    description: "Apunta al proceso correcto a la primera.",
    price: 320, requires: 6,
    image: { src: "/avatares/av_neon.webp", w: 146, h: 240 },
  },
  {
    id: "av_arquera",
    kind: "avatar",
    name: "Arquera del bosque",
    description: "Paciente. Espera a que el servidor baje la guardia.",
    price: 340, requires: 7,
    image: { src: "/avatares/av_arquera.webp", w: 187, h: 240 },
  },
  {
    id: "av_maga",
    kind: "avatar",
    name: "Maga arcana",
    description: "Sus conjuros son alias que nadie más entiende.",
    price: 380, requires: 8,
    image: { src: "/avatares/av_maga.webp", w: 190, h: 240 },
  },
  {
    id: "av_bruja",
    kind: "avatar",
    name: "Bruja del shell",
    description: "Invoca con un pipe y tres comandos encadenados.",
    price: 400, requires: 8,
    image: { src: "/avatares/av_bruja.webp", w: 182, h: 240 },
  },
  {
    id: "av_francotiradora",
    kind: "avatar",
    name: "Francotiradora",
    description: "Un disparo, un bug menos.",
    price: 430, requires: 10,
    image: { src: "/avatares/av_francotiradora.webp", w: 183, h: 240 },
  },
  {
    id: "av_trol",
    kind: "avatar",
    name: "Trol de root",
    description: "Vive bajo el sistema de archivos y cobra peaje.",
    price: 460, requires: 10,
    image: { src: "/avatares/av_trol.webp", w: 217, h: 240 },
  },
  {
    id: "av_mecha",
    kind: "avatar",
    name: "Mecha de asalto",
    description: "Cañón, escudo y ni un solo ciclo desperdiciado.",
    price: 500, requires: 12,
    image: { src: "/avatares/av_mecha.webp", w: 236, h: 240 },
  },
  {
    id: "av_demonio",
    kind: "avatar",
    name: "Demonio del kernel",
    description: "Lo invocaron con un rm -rf y ya no se fue.",
    price: 550, requires: 14,
    image: { src: "/avatares/av_demonio.webp", w: 208, h: 240 },
  },
  {
    id: "av_espectro",
    kind: "avatar",
    name: "Caballero espectral",
    description: "Sigue rondando el servidor que apagaron en 2009.",
    price: 600, requires: 16,
    image: { src: "/avatares/av_espectro.webp", w: 223, h: 240 },
  },

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
