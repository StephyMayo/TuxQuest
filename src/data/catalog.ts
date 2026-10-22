import type { Difficulty, DifficultyRules, Distro, Family, FamilyId, Topic } from "./types.ts";

export const FAMILIES: Family[] = [
  {
    id: "debian",
    name: "Debian",
    packageManager: "apt",
    example: "sudo apt install firefox",
    color: "#d70751",
    description: "La familia más usada para empezar. Estable y con muchísima documentación.",
  },
  {
    id: "arch",
    name: "Arch",
    packageManager: "pacman",
    example: "sudo pacman -S firefox",
    color: "#1793d1",
    description: "Rolling release: siempre lo más nuevo. Ideal para aprender cómo funciona Linux por dentro.",
  },
  {
    id: "redhat",
    name: "Red Hat",
    packageManager: "dnf",
    example: "sudo dnf install firefox",
    color: "#ee0000",
    description: "La familia de los servidores empresariales y de Fedora en escritorio.",
  },
  {
    id: "suse",
    name: "SUSE",
    packageManager: "zypper",
    example: "sudo zypper install firefox",
    color: "#30ba78",
    description: "Robusta y con YaST. Tumbleweed es rolling, Leap es estable.",
  },
];

export const DISTROS: Distro[] = [
  { id: "debian", familyId: "debian", name: "Debian", hostname: "debian", description: "La distribución madre de la familia." },
  { id: "ubuntu", familyId: "debian", name: "Ubuntu", hostname: "ubuntu", description: "La más popular para escritorio y nube." },
  { id: "mint", familyId: "debian", name: "Linux Mint", hostname: "mint", description: "Muy amigable para quien viene de Windows." },
  { id: "archlinux", familyId: "arch", name: "Arch Linux", hostname: "archlinux", description: "Minimalista: tú construyes tu sistema." },
  { id: "cachyos", familyId: "arch", name: "CachyOS", hostname: "cachyos", description: "Arch optimizado para rendimiento." },
  { id: "manjaro", familyId: "arch", name: "Manjaro", hostname: "manjaro", description: "Arch con instalador fácil y herramientas propias." },
  { id: "endeavouros", familyId: "arch", name: "EndeavourOS", hostname: "endeavour", description: "Arch casi puro con instalación sencilla." },
  { id: "fedora", familyId: "redhat", name: "Fedora", hostname: "fedora", description: "Tecnología nueva, patrocinada por Red Hat." },
  { id: "rocky", familyId: "redhat", name: "Rocky Linux", hostname: "rocky", description: "Compatible con Red Hat Enterprise, para servidores." },
  { id: "alma", familyId: "redhat", name: "AlmaLinux", hostname: "alma", description: "Otra alternativa libre a Red Hat Enterprise." },
  { id: "tumbleweed", familyId: "suse", name: "openSUSE Tumbleweed", hostname: "tumbleweed", description: "Rolling release probado automáticamente." },
  { id: "leap", familyId: "suse", name: "openSUSE Leap", hostname: "leap", description: "Versión estable, basada en SUSE Enterprise." },
];

export const DIFFICULTIES: DifficultyRules[] = [
  {
    id: "facil",
    name: "Fácil",
    types: ["choice", "complete"],
    seconds: null,
    hintCost: 0,
    coins: 5,
    commands: "Básicos (ls, cd, mkdir, pwd)",
  },
  {
    id: "medio",
    name: "Medio",
    types: ["write"],
    seconds: 60,
    hintCost: 3,
    coins: 10,
    commands: "Intermedios (permisos, búsqueda, instalar programas)",
  },
  {
    id: "dificil",
    name: "Difícil",
    types: ["write", "fix"],
    seconds: 30,
    hintCost: null,
    coins: 20,
    commands: "Avanzados (varias opciones, procesos, servicios)",
  },
];

export const TOPICS: Record<Topic, { title: string; description: string; order: number }> = {
  navegacion: { title: "Primeros pasos", description: "Moverte entre carpetas y saber dónde estás.", order: 1 },
  archivos: { title: "Manos a los archivos", description: "Crear, copiar, mover, leer y borrar.", order: 2 },
  paquetes: { title: "Instalar programas", description: "El gestor de paquetes de tu familia.", order: 3 },
  permisos: { title: "Permisos y usuarios", description: "Quién puede leer, escribir o ejecutar.", order: 4 },
  busqueda: { title: "Buscar y filtrar", description: "Encontrar archivos y texto.", order: 5 },
  sistema: { title: "Conoce tu sistema", description: "Disco, memoria y información del equipo.", order: 6 },
  procesos: { title: "Procesos", description: "Ver y detener programas en ejecución.", order: 7 },
  servicios: { title: "Servicios", description: "Controlar servicios con systemd.", order: 8 },
  redes: { title: "Redes", description: "Conectividad y acceso remoto.", order: 9 },
};

export const MISSION_PASS_RATIO = 0.7;
export const MISSION_SIZE = 6;
export const STARTING_COINS = 20;

export const familyById = (id: string) => FAMILIES.find((f) => f.id === id);
export const distrosOf = (familyId: FamilyId) => DISTROS.filter((d) => d.familyId === familyId);
export const difficultyById = (id: string) => DIFFICULTIES.find((d) => d.id === id);
export const isDifficulty = (v: string): v is Difficulty => DIFFICULTIES.some((d) => d.id === v);
