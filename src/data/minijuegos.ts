/**
 * Contenido de los minijuegos del modo historia que no sale del banco de
 * preguntas: rastro, procesos, tablero y ruta.
 */

// ---------------------------------------------------------------------------
// Rastro: marcar las líneas que encajan con un patrón (lo que hacen find y grep)
// ---------------------------------------------------------------------------
export interface RastroRonda {
  /** Lo que se busca, tal cual se le pasaría al comando. */
  pattern: string;
  /** Con qué comando se haría de verdad. */
  tool: string;
  /** Qué significa el patrón, se enseña al corregir. */
  hint: string;
  /** Cada línea con si encaja o no. */
  lines: { text: string; match: boolean }[];
}

export const RASTRO: RastroRonda[] = [
  {
    pattern: "*.txt",
    tool: "find . -name '*.txt'",
    hint: "El asterisco vale por cualquier cosa, así que *.txt es «lo que sea, terminado en .txt».",
    lines: [
      { text: "notas.txt", match: true },
      { text: "informe.txt", match: true },
      { text: "foto.jpg", match: false },
      { text: "txt.sh", match: false },
      { text: "tareas.txt", match: true },
      { text: "musica.mp3", match: false },
    ],
  },
  {
    pattern: "conf*",
    tool: "ls conf*",
    hint: "El asterisco va al final: vale cualquier cosa que empiece por «conf».",
    lines: [
      { text: "config", match: true },
      { text: "configuracion.ini", match: true },
      { text: "miconf", match: false },
      { text: "conf.d", match: true },
      { text: "reconfigurar.sh", match: false },
      { text: "conf", match: true },
    ],
  },
  {
    pattern: "^Linux",
    tool: "grep '^Linux' notas.txt",
    hint: "El acento circunflejo ancla al principio de la línea: solo las que empiezan por «Linux».",
    lines: [
      { text: "Linux es libre y gratuito.", match: true },
      { text: "la terminal de linux es poderosa", match: false },
      { text: "Linux tiene muchas distribuciones", match: true },
      { text: "Me gusta Linux", match: false },
      { text: "Linux.", match: true },
      { text: " Linux con espacio delante", match: false },
    ],
  },
  {
    pattern: "error$",
    tool: "grep 'error$' sistema.log",
    hint: "El dólar ancla al final: solo las líneas que acaban en «error».",
    lines: [
      { text: "fallo de lectura: error", match: true },
      { text: "error al abrir el archivo", match: false },
      { text: "se produjo un error", match: true },
      { text: "errores varios", match: false },
      { text: "disco sin error", match: true },
      { text: "error", match: true },
    ],
  },
  {
    pattern: "-i linux",
    tool: "grep -i linux notas.txt",
    hint: "La opción -i hace que no distinga mayúsculas de minúsculas.",
    lines: [
      { text: "Linux es libre", match: true },
      { text: "la terminal de linux", match: true },
      { text: "LINUX en mayúsculas", match: true },
      { text: "el pingüino Tux", match: false },
      { text: "GNU/Linux", match: true },
      { text: "sistemas operativos", match: false },
    ],
  },
];

// ---------------------------------------------------------------------------
// Procesos: cerrar los que sobran sin tocar los del sistema
// ---------------------------------------------------------------------------
export interface Proceso {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  state: string;
  cmd: string;
  /** true = hay que cerrarlo. */
  rogue: boolean;
  /** Por qué sí o por qué no, se enseña al final. */
  why: string;
}

export const PROCESOS: Proceso[] = [
  { pid: 1, user: "root", cpu: 0.0, mem: 0.3, state: "Ss", cmd: "/sbin/init", rogue: false, why: "Es el proceso 1: si lo matas, se cae el sistema entero." },
  { pid: 812, user: "root", cpu: 0.1, mem: 1.2, state: "Ssl", cmd: "NetworkManager", rogue: false, why: "Gestiona la red. Sin él te quedas sin conexión." },
  { pid: 1033, user: "www", cpu: 0.4, mem: 2.1, state: "S", cmd: "nginx: worker", rogue: false, why: "Es el servidor web haciendo su trabajo." },
  { pid: 2210, user: "tux", cpu: 98.7, mem: 41.0, state: "R", cmd: "firefox --renderer", rogue: true, why: "Casi 100 % de CPU y 41 % de memoria: se ha desbocado." },
  { pid: 2318, user: "tux", cpu: 0.0, mem: 0.0, state: "Z", cmd: "[actualizar] <defunct>", rogue: true, why: "La Z es de zombi: terminó pero nadie recogió su salida." },
  { pid: 3001, user: "tux", cpu: 0.2, mem: 0.8, state: "Ss", cmd: "bash", rogue: false, why: "Es tu propia terminal. Cerrarla te echa a ti." },
  { pid: 4321, user: "tux", cpu: 0.0, mem: 0.1, state: "Z", cmd: "[python3] <defunct>", rogue: true, why: "Otro zombi: ocupa sitio en la tabla sin hacer nada." },
  { pid: 5120, user: "tux", cpu: 87.3, mem: 3.4, state: "R", cmd: "./minar.sh", rogue: true, why: "Un script tuyo comiéndose la CPU. Nadie lo lanzó a propósito." },
  { pid: 640, user: "root", cpu: 0.0, mem: 0.4, state: "Ss", cmd: "bluetoothd", rogue: false, why: "Servicio del sistema, tranquilo y en su sitio." },
  { pid: 6677, user: "tux", cpu: 0.0, mem: 0.0, state: "Z", cmd: "[respaldo] <defunct>", rogue: true, why: "Zombi del respaldo de anoche." },
];

// ---------------------------------------------------------------------------
// Tablero: llevar cada servicio a su estado con la acción correcta
// ---------------------------------------------------------------------------
export type EstadoServicio = "activo" | "parado" | "fallido";
export type AccionServicio = "start" | "stop" | "restart" | "enable" | "status";

export const ACCIONES: Record<AccionServicio, string> = {
  start: "systemctl start",
  stop: "systemctl stop",
  restart: "systemctl restart",
  enable: "systemctl enable",
  status: "systemctl status",
};

export interface ServicioRonda {
  name: string;
  from: EstadoServicio;
  /** Lo que hay que conseguir, con palabras. */
  goal: string;
  answer: AccionServicio;
  why: string;
}

export const SERVICIOS: ServicioRonda[] = [
  { name: "nginx", from: "parado", goal: "ponerlo en marcha ahora mismo", answer: "start", why: "start lo arranca en este momento, sin tocar si arranca solo al encender." },
  { name: "mysql", from: "fallido", goal: "levantarlo otra vez tras el fallo", answer: "restart", why: "restart lo para del todo y lo vuelve a arrancar: es lo que saca a un servicio de «failed»." },
  { name: "bluetooth", from: "activo", goal: "apagarlo porque no se usa", answer: "stop", why: "stop lo detiene ahora. Si además no quieres que vuelva al reiniciar, hace falta disable." },
  { name: "sshd", from: "parado", goal: "que arranque solo cada vez que encienda el equipo", answer: "enable", why: "enable no lo arranca ahora: lo deja marcado para los próximos arranques." },
  { name: "cups", from: "activo", goal: "comprobar si de verdad está funcionando", answer: "status", why: "status enseña el estado y las últimas líneas de registro, sin cambiar nada." },
  { name: "cron", from: "fallido", goal: "ver por qué ha fallado antes de tocar nada", answer: "status", why: "Lo primero ante un fallo es mirar, no reiniciar a ciegas." },
  { name: "docker", from: "parado", goal: "arrancarlo para trabajar hoy", answer: "start", why: "start y punto: enable sería para que volviera solo mañana." },
  { name: "apache2", from: "activo", goal: "aplicar un cambio de configuración", answer: "restart", why: "La configuración se lee al arrancar, así que hay que reiniciarlo para que la tome." },
];

// ---------------------------------------------------------------------------
// Ruta: encontrar en qué salto se rompe la conexión
// ---------------------------------------------------------------------------
export interface Salto {
  name: string;
  /** Lo que se comprueba en este tramo. */
  question: string;
  /** Herramienta correcta. */
  answer: string;
  options: string[];
  /** Lo que sale al usarla. */
  result: string;
  /** Si aquí es donde está la avería. */
  broken: boolean;
  why: string;
}

export const RUTA: Salto[] = [
  {
    name: "Tu máquina",
    question: "¿Tiene tu equipo una dirección IP asignada?",
    answer: "ip a",
    options: ["ip a", "ping 8.8.8.8", "ssh servidor", "systemctl status"],
    result: "eth0: 192.168.1.42/24 — la interfaz está levantada y con dirección.",
    broken: false,
    why: "ip a lista las interfaces y sus direcciones: es la primera comprobación de todas.",
  },
  {
    name: "La puerta de enlace",
    question: "¿Responde el router de tu red?",
    answer: "ping 192.168.1.1",
    options: ["ping 192.168.1.1", "ip a", "cat /etc/hosts", "ss -tuln"],
    result: "64 bytes desde 192.168.1.1: tiempo=1.2 ms — el router contesta.",
    broken: false,
    why: "ping manda un paquete y espera respuesta: sirve para saber si el otro extremo está vivo.",
  },
  {
    name: "La salida a internet",
    question: "¿Se llega a una dirección de fuera?",
    answer: "ping 8.8.8.8",
    options: ["ping 8.8.8.8", "ping 192.168.1.1", "ip a", "systemctl restart"],
    result: "64 bytes desde 8.8.8.8: tiempo=18 ms — hay salida a internet.",
    broken: false,
    why: "Si la IP de fuera responde pero el nombre no, el problema es de DNS, no de conexión.",
  },
  {
    name: "Los nombres",
    question: "¿Se traducen los nombres a direcciones?",
    answer: "ping google.com",
    options: ["ping google.com", "ping 8.8.8.8", "ss -tuln", "ip a"],
    result: "ping: google.com: fallo temporal en la resolución de nombres.",
    broken: true,
    why: "Aquí está la avería: la red funciona, pero el equipo no sabe traducir nombres. Es el DNS.",
  },
  {
    name: "El puerto del servidor",
    question: "¿Está el servicio escuchando en su puerto?",
    answer: "ss -tuln",
    options: ["ss -tuln", "ping servidor", "ip a", "ssh servidor"],
    result: "LISTEN 0 128 0.0.0.0:22 — el servicio de SSH está escuchando.",
    broken: false,
    why: "ss lista los puertos abiertos: sirve para saber si un servicio está esperando conexiones.",
  },
  {
    name: "El otro extremo",
    question: "¿Puedes entrar en la máquina remota?",
    answer: "ssh tux@servidor",
    options: ["ssh tux@servidor", "ping servidor", "ss -tuln", "ip a"],
    result: "Conectado. Bienvenido a servidor.",
    broken: false,
    why: "ssh abre una sesión en la máquina remota: es el último paso, cuando todo lo de debajo funciona.",
  },
];
