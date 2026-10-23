/**
 * Modo historia: «El Camino de la Terminal».
 *
 * Nueve capítulos en tres actos. Cada uno usa el mismo tema que las misiones
 * -de ahí salen los comandos- y un minijuego distinto, para que aprender no
 * sea repetir siempre lo mismo.
 *
 * El capítulo se juega en cuatro pasos: historia, cómo se juega, minijuego y
 * desenlace.
 */
import type { Topic } from "./types.ts";

export type GameId =
  | "terminal"
  | "defensa"
  | "montar"
  | "candado"
  | "rastro"
  | "memoria"
  | "processes"
  | "tablero"
  | "ruta";
export type EnemyId = "bicho" | "zombi" | "fuga" | "roto" | "huerfano";
export type BossId = "panico" | "bucle" | "disco" | "root";

/** Objetivo del minijuego de terminal, comprobado contra la shell simulada. */
export type Goal =
  | { kind: "ran"; prefix: string; text: string }
  | { kind: "cwd"; path: string; text: string }
  | { kind: "exists"; path: string; text: string }
  | { kind: "gone"; path: string; text: string };

export interface Chapter {
  /** Coincide con el tema de las misiones: de ahí salen los comandos. */
  topic: Topic;
  act: number;
  title: string;
  /** Dónde ocurre, se muestra bajo el título. */
  place: string;
  /** Lo que el jugador aprende, en una línea. */
  lesson: string;
  game: GameId;
  /** Narración antes de jugar. */
  intro: string[];
  /** Narración al superarlo. */
  outro: string[];
  enemies: EnemyId[];
  boss?: BossId;
  /** Rondas, enemigos o parejas, según el minijuego. */
  rounds: number;
  /** Solo para el minijuego de terminal. */
  goals?: Goal[];
}

export const PROLOGUE = {
  title: "Antes de empezar",
  text: [
    "Durante treinta años el Núcleo funcionó sin que nadie tuviera que mirarlo. Arrancaba, servía, respondía, y volvía a arrancar al día siguiente.",
    "La gente dejó de entender cómo. Primero dejaron de leer los registros. Luego dejaron de abrir la terminal. Al final solo quedaron botones, y detrás de los botones, nadie.",
    "Cuando el Núcleo empezó a fallar, no hubo quien supiera por dónde mirar. Los procesos se torcieron, los servicios se durmieron y el sistema se cerró sobre sí mismo.",
    "Queda un pingüino que sí recuerda. Y quedas tú, que todavía no sabes nada, que es exactamente por donde hay que empezar.",
  ],
};

export const INTERLUDES: Record<number, { title: string; text: string[] }> = {
  2: {
    title: "Entre el Acto I y el Acto II",
    text: [
      "Con lo que sabes ya podrías vivir aquí abajo: moverte, tocar archivos, traer lo que te falte. Mucha gente no pasa de aquí y le basta.",
      "Pero Tux se queda mirando una puerta cerrada al fondo del pasillo. «Lo que hemos hecho hasta ahora es tu casa», dice. «Lo que hay detrás de esa puerta es el sistema. No es lo mismo.»",
      "«A partir de aquí, un comando mal escrito ya no se queda en un archivo perdido.»",
    ],
  },
  3: {
    title: "Entre el Acto II y el Acto III",
    text: [
      "Ya sabes mirar dentro de la máquina: quién manda sobre cada archivo, dónde está lo que buscas, cuánto aguanta el disco.",
      "Lo que viene no está quieto. Los procesos se ejecutan, los servicios responden, la red contesta. Son cosas vivas, y algunas llevan años sin que nadie las revise.",
      "«Hasta ahora leías el sistema», dice Tux. «A partir de aquí lo gobiernas. Procura merecerlo.»",
    ],
  },
};

export const EPILOGUE = {
  title: "El Núcleo despierta",
  text: [
    "El Núcleo arranca. No con un estruendo: con una línea de registro que dice que todo está en orden, y luego otra, y luego otra.",
    "Tux se sienta en el borde de la pantalla sin decir nada durante un rato largo.",
    "«Lo que has aprendido no era magia», dice al final. «Eran veinte o treinta comandos y entender qué hace cada uno. Eso es todo lo que separaba a quien sabía de quien no.»",
    "«Ahora ve y rompe algo en tu propia máquina. Es la única forma de que lo de hoy se te quede.»",
  ],
};

export const STORY: Chapter[] = [
  // ---------------- Acto I ----------------
  {
    topic: "navigation",
    act: 1,
    title: "Despertar en /home",
    place: "El directorio personal",
    lesson: "Saber dónde estás y cómo moverte.",
    game: "terminal",
    rounds: 5,
    intro: [
      "Despiertas en una carpeta que lleva tu nombre y no recuerdas haber entrado. No hay ventanas, ni iconos, ni ratón. Solo una línea que parpadea esperando.",
      "Un pingüino te observa desde el borde de la pantalla, con esa cara de quien ya ha visto esto demasiadas veces.",
      "«Lo primero que todo el mundo quiere es arreglar algo», dice. «Y lo primero que hay que hacer es saber dónde estás parado. La mitad de los desastres empiezan por ejecutar el comando correcto en la carpeta equivocada.»",
      "«Mira dónde estás. Mira qué hay. Y aprende a ir a otro sitio y volver. Hoy no vamos a hacer nada más.»",
    ],
    outro: [
      "Ya no estás perdido. Sabes en qué carpeta pisas, qué hay dentro y cómo llegar a cualquier otra.",
      "«Parece poco», dice Tux. «Es lo único que no vas a dejar de usar nunca.»",
    ],
    enemies: [],
    goals: [
      { kind: "ran", prefix: "pwd", text: "Averigua en qué carpeta estás ahora mismo" },
      { kind: "ran", prefix: "ls", text: "Mira qué hay dentro" },
      { kind: "cwd", path: "/home/tux/Documentos", text: "Entra en la carpeta Documentos" },
      { kind: "cwd", path: "/etc", text: "Sube hasta /etc, que está fuera de tu casa" },
      { kind: "cwd", path: "/home/tux", text: "Vuelve a tu carpeta personal" },
    ],
  },
  {
    topic: "files",
    act: 1,
    title: "El taller de archivos",
    place: "/var/taller",
    lesson: "Crear, copiar, mover y borrar sin llevarte nada por delante.",
    game: "defensa",
    rounds: 10,
    boss: "panico",
    intro: [
      "Al final del pasillo hay un taller lleno de archivos a medio escribir, copias duplicadas y carpetas sin nombre. Huele a trabajo abandonado.",
      "«El desorden también es un fallo», gruñe Tux. «Aquí se aprende a tocar las cosas sin romperlas.»",
      "Algo mordisquea un archivo de configuración en un rincón. Cuando se gira, ves que no está solo.",
      "«Y aquí aprendes lo más peligroso de todo esto: borrar. La terminal no pregunta dos veces. No hay papelera. Lo que quitas, se fue.»",
    ],
    outro: [
      "El taller vuelve a estar en orden. Sabes crear, copiar, mover y borrar, y sobre todo sabes que lo último no tiene vuelta atrás.",
      "Algo se desploma al fondo con un ruido metálico. Lo que fuera, ya no se mueve.",
    ],
    enemies: ["bicho", "zombi"],
  },
  {
    topic: "packages",
    act: 1,
    title: "El almacén de paquetes",
    place: "El depósito del gestor",
    lesson: "Instalar, actualizar y quitar programas con el gestor de tu familia.",
    game: "montar",
    rounds: 8,
    intro: [
      "El almacén está reventado. Cajas abiertas, dependencias sueltas, media instalación a medio terminar por todas partes.",
      "«Cada familia tiene su propia llave para este almacén», dice Tux. «Debian abre con una, Arch con otra, Red Hat con otra. El almacén es el mismo; la llave, no.»",
      "Encuentras órdenes de instalación tiradas por el suelo, pero están incompletas. Les falta justo la palabra que importa.",
      "«Ese hueco es el que tienes que aprender a rellenar. Porque el día que estés en una máquina que no es la tuya, el gestor será lo primero que cambie.»",
    ],
    outro: [
      "El almacén responde otra vez. Con un gestor de paquetes en las manos ya no solo reparas: puedes construir.",
      "«Ya puedes traerte cualquier programa que exista», dice Tux. «Procura saber qué estás trayendo.»",
    ],
    enemies: [],
  },

  // ---------------- Acto II ----------------
  {
    topic: "permissions",
    act: 2,
    title: "La puerta de permisos",
    place: "La frontera de /etc",
    lesson: "Quién puede leer, escribir y ejecutar cada cosa.",
    game: "candado",
    rounds: 10,
    intro: [
      "Una puerta de hierro cierra el paso. No tiene cerradura ni llave: tiene tres letras repetidas tres veces, y según cómo estén, pasas o no pasas.",
      "«Aquí abajo nadie entra por ser quien es», avisa Tux. «Se entra por lo que te dejan hacer. Dueño, grupo y todos los demás. Leer, escribir, ejecutar.»",
      "La puerta te va a preguntar. Y no va a esperar mucho por la respuesta.",
      "«Esto no se escribe, se reconoce. Cuando lleves mil veces mirando un rwxr-xr-x lo vas a leer de un vistazo, como una palabra.»",
    ],
    outro: [
      "La puerta cede. Entiendes quién manda sobre cada archivo del sistema, y eso es media seguridad de cualquier máquina.",
      "Al otro lado, el aire está más frío.",
    ],
    enemies: [],
  },
  {
    topic: "search",
    act: 2,
    title: "El laberinto de datos",
    place: "Los archivos profundos",
    lesson: "Encontrar un archivo, y una línea dentro de un archivo.",
    game: "rastro",
    rounds: 4,
    intro: [
      "Debajo de /etc se abre un laberinto de carpetas que nadie ha recorrido entero. Hay registros de hace veinte años que nadie volvió a abrir.",
      "«Lo que buscas está aquí», dice Tux. «Lo que no sabes es dónde. Y mirar carpeta por carpeta te llevaría más de lo que vas a vivir.»",
      "«Hay dos preguntas distintas y la gente las confunde siempre: dónde está este archivo, y en qué archivo está escrita esta palabra. No se responden con el mismo comando.»",
      "Te sientas delante de la terminal. El laberinto espera.",
    ],
    outro: [
      "Ya no buscas a ciegas. Puedes encontrar cualquier cosa en el sistema, estés donde estés.",
      "«Esto», dice Tux, «es lo que separa a quien usa la terminal de quien la sufre.»",
    ],
    enemies: [],
  },
  {
    topic: "system",
    act: 2,
    title: "La sala de máquinas",
    place: "El corazón del Núcleo",
    lesson: "Disco, memoria y qué equipo tienes debajo.",
    game: "memoria",
    rounds: 6,
    intro: [
      "La sala de máquinas está caliente. Los discos giran al límite y la memoria no para de llenarse sola.",
      "«Para arreglar algo primero hay que medirlo», dice Tux. «Y para medirlo hay que saber qué comando responde a cada pregunta.»",
      "En la pared hay un panel con los comandos por un lado y lo que hacen por otro, todo descolocado.",
      "«Empareja cada uno con lo suyo. Si te confundes de comando, vas a creer que tienes un problema de disco cuando lo que te falta es memoria.»",
    ],
    outro: [
      "El panel vuelve a estar emparejado y la sala baja de temperatura.",
      "Ahora sabes leer el estado de tu propia máquina. Cuando algo vaya mal, dejarás de adivinar.",
    ],
    enemies: [],
  },

  // ---------------- Acto III ----------------
  {
    topic: "processes",
    act: 3,
    title: "Los procesos fantasma",
    place: "La tabla de procesos",
    lesson: "Ver qué se está ejecutando y pararlo.",
    game: "processes",
    rounds: 8,
    boss: "bucle",
    intro: [
      "Hay procesos que terminaron hace meses y siguen ocupando sitio. Nadie los lanzó. Nadie consigue cerrarlos.",
      "Encuentras las órdenes que alguien dejó escritas para detenerlos. Están todas mal: una letra cambiada, un número que no es, una opción que no existe.",
      "«Esto ya no es ordenar», dice Tux, y por primera vez no suena tranquilo. «Esto es echar a alguien de tu casa. Y el que escribió esto se equivocó. Por eso siguen aquí.»",
      "Uno de los procesos se gira hacia ti y repite tu nombre de usuario.",
    ],
    outro: [
      "La tabla de procesos vuelve a tener sentido. Nada se ejecuta en tu sistema sin que puedas verlo y detenerlo.",
      "El que repetía tu nombre se apaga a media palabra.",
    ],
    enemies: [],
  },
  {
    topic: "services",
    act: 3,
    title: "Los servicios dormidos",
    place: "La sala de systemd",
    lesson: "Arrancar, parar y consultar servicios.",
    game: "tablero",
    rounds: 10,
    boss: "disco",
    intro: [
      "Doce servicios deberían estar en marcha. Responden tres, y uno de ellos miente sobre su estado.",
      "«Un servicio no es un programa que abres», explica Tux. «Es uno que el sistema mantiene vivo por ti, lo mires o no. Si sabes hablarles, el Núcleo vuelve solo.»",
      "Las luces de la sala parpadean en un orden que no parece casual.",
      "«Te van a preguntar deprisa, y hay que contestar bien. Un servicio mal arrancado es peor que uno parado: parece que funciona.»",
    ],
    outro: [
      "Los servicios responden uno detrás de otro. El Núcleo empieza a respirar por su cuenta.",
      "Queda una sola puerta, y detrás se oye el mundo.",
    ],
    enemies: [],
  },
  {
    topic: "network",
    act: 3,
    title: "El puente de red",
    place: "La salida del Núcleo",
    lesson: "Conectividad, puertos y acceso remoto.",
    game: "ruta",
    rounds: 16,
    boss: "root",
    intro: [
      "El último tramo es un puente de paquetes que no llegan a ninguna parte. El Núcleo lleva días sin hablar con nadie de fuera.",
      "«Falta una cosa», dice Tux. «Un sistema aislado está a salvo y está muerto. Hay que abrirlo, y ahí es donde casi todo el mundo se equivoca.»",
      "Al otro lado del puente hay alguien esperando de pie. No se mueve. Lleva esperando desde antes de que tú llegaras.",
      "«Ah», dice Tux, y se queda callado. «Él también hizo este camino. Llegó hasta aquí y no supo parar.»",
    ],
    outro: [
      "El puente aguanta. Los paquetes salen y vuelven, y por primera vez en días el Núcleo recibe una respuesta de fuera.",
      "La figura del otro lado se deshace sin resistirse, casi con alivio.",
    ],
    enemies: ["bicho", "zombi", "fuga", "roto", "huerfano"],
  },
];

export const ACTS: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Acto I · Los primeros pasos", subtitle: "Moverte, tocar archivos y traer programas." },
  2: { title: "Acto II · Bajo la superficie", subtitle: "Permisos, búsqueda y las tripas de la máquina." },
  3: { title: "Acto III · El Núcleo", subtitle: "Procesos, servicios y la salida al mundo." },
};

/** Cómo se juega cada minijuego, para la pantalla previa. */
export const GAMES: Record<GameId, { name: string; rules: string[] }> = {
  terminal: {
    name: "Terminal guiada",
    rules: [
      "Tienes delante una terminal de verdad, con sus carpetas y sus archivos.",
      "Arriba verás una lista de objetivos. Ve cumpliéndolos escribiendo comandos.",
      "Puedes equivocarte todas las veces que quieras: aquí no se pierde nada.",
    ],
  },
  defensa: {
    name: "Defensa de la terminal",
    rules: [
      "Los enemigos avanzan hacia Tux con un comando escrito encima.",
      "Escribe ese comando y pulsa Enter para derribarlo antes de que llegue.",
      "Si uno llega hasta Tux, pierdes una vida. Tienes tres.",
    ],
  },
  montar: {
    name: "Monta el comando",
    rules: [
      "Te decimos qué hay que conseguir y te damos las piezas del comando desordenadas.",
      "Pulsa las piezas en el orden correcto para armarlo. Puedes quitar la última si te equivocas.",
      "No se escribe nada: aquí lo que se practica es el orden y qué pieza sobra.",
    ],
  },
  candado: {
    name: "Candado de permisos",
    rules: [
      "Cada archivo tiene nueve interruptores: leer, escribir y ejecutar, para el dueño, el grupo y los demás.",
      "Te pedimos un permiso con palabras y tú lo marcas en la rejilla.",
      "Abajo verás a la vez cómo se escribe en letras (rwxr-xr--) y en números (754).",
    ],
  },
  memoria: {
    name: "Panel de parejas",
    rules: [
      "El panel tiene cartas boca abajo: comandos por un lado, lo que hacen por otro.",
      "Destapa dos. Si son pareja, se quedan. Si no, vuelven a taparse.",
      "No hay reloj, pero cada fallo cuenta para la puntuación.",
    ],
  },
  rastro: {
    name: "Sigue el rastro",
    rules: [
      "Te damos un patrón -algo como *.txt o ^Linux- y una lista de líneas.",
      "Marca todas las que encajan con el patrón y ninguna más.",
      "Es lo que hacen por dentro find y grep: comparar contra un patrón.",
    ],
  },
  tablero: {
    name: "Tablero de servicios",
    rules: [
      "Cada servicio tiene un estado actual y uno al que debe llegar.",
      "Elige la acción de systemctl que lo lleva de uno a otro.",
      "Un servicio mal arrancado es peor que uno parado: parece que funciona.",
    ],
  },
  ruta: {
    name: "Sigue la ruta",
    rules: [
      "El paquete sale de tu máquina y debería llegar al otro extremo.",
      "En cada salto elige la herramienta con la que se comprueba ese tramo.",
      "Cuando des con el salto roto, habrás encontrado la avería.",
    ],
  },
  processes: {
    name: "Sala de procesos",
    rules: [
      "Tienes delante la tabla de procesos del Núcleo, como la que saca ps.",
      "Algunos están colgados, zombis o comiéndose la máquina. Ciérralos escribiendo kill y su PID.",
      "Cuidado: otros son del sistema y hacen falta. Si cierras uno de esos, lo pagas.",
    ],
  },
};

/** Lo que distingue a cada enemigo en el minijuego de defensa. */
export interface EnemyKind {
  id: EnemyId;
  name: string;
  trait: string;
  speed: number;
  hits: number;
}

export const ENEMIES: Record<EnemyId, EnemyKind> = {
  bicho: { id: "bicho", name: "Bicho", trait: "Avanza sin más. Un comando y fuera.", speed: 1, hits: 1 },
  zombi: {
    id: "zombi",
    name: "Proceso zombi",
    trait: "Lento, pero no se va con un solo comando: hay que rematarlo.",
    speed: 0.62,
    hits: 2,
  },
  fuga: { id: "fuga", name: "Fuga de memoria", trait: "Empieza despacio y acelera cuanto más vive.", speed: 0.75, hits: 1 },
  roto: { id: "roto", name: "Paquete roto", trait: "Al romperlo se parte en dos trozos más pequeños.", speed: 0.9, hits: 1 },
  huerfano: {
    id: "huerfano",
    name: "Demonio huérfano",
    trait: "Protege al enemigo que tenga más cerca: hay que quitarlo de en medio primero.",
    speed: 0.8,
    hits: 1,
  },
};

export interface BossKind {
  id: BossId;
  name: string;
  taunt: string;
  hits: number;
  speed: number;
}

export const BOSSES: Record<BossId, BossKind> = {
  panico: { id: "panico", name: "Kernel Panic", taunt: "«No hay nada que salvar. Apágalo.»", hits: 6, speed: 0.5 },
  bucle: { id: "bucle", name: "Bucle Infinito", taunt: "«Otra vez. Otra vez. Otra vez.»", hits: 8, speed: 0.45 },
  disco: { id: "disco", name: "Disco Lleno", taunt: "«Ya no cabe nada más. Ni tú.»", hits: 9, speed: 0.4 },
  root: { id: "root", name: "El Root Perdido", taunt: "«Yo también llegué hasta aquí. Mira en qué me convertí.»", hits: 12, speed: 0.42 },
};

export const chapterByTopic = (topic: string) => STORY.find((c) => c.topic === topic);
export const chapterIndex = (topic: string) => STORY.findIndex((c) => c.topic === topic);
export const storyKey = (topic: string) => `historia:${topic}`;
/** Monedas por acierto. */
export const COINS_PER_WIN = 4;
/** Aciertos necesarios, en tanto por uno, para superar un capítulo. */
export const PASS_RATIO = 0.7;
