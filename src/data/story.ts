/**
 * Modo historia: «El Camino de la Terminal».
 *
 * Cada capítulo es una parada del aprendizaje real de la terminal y usa el
 * mismo tema que las misiones (`Topic`), así que los comandos salen del banco
 * de preguntas de la familia que el jugador haya elegido.
 */
import type { Topic } from "./types.ts";

export type EnemyId = "bicho" | "zombi" | "fuga" | "roto" | "huerfano";
export type BossId = "panico" | "bucle" | "disco" | "root";

export interface Chapter {
  /** Coincide con el tema de las misiones: de ahí salen los comandos. */
  topic: Topic;
  act: number;
  title: string;
  /** Dónde ocurre, se muestra bajo el título. */
  place: string;
  /** Lo que el jugador aprende, en una línea. */
  lesson: string;
  /** Narración antes de la batalla. */
  intro: string[];
  /** Narración al superarla. */
  outro: string;
  enemies: EnemyId[];
  boss?: BossId;
  /** Enemigos que hay que derrotar para terminar el capítulo. */
  waves: number;
}

export const STORY: Chapter[] = [
  {
    topic: "navegacion",
    act: 1,
    title: "Despertar en /home",
    place: "El directorio personal",
    lesson: "Saber dónde estás y cómo moverte.",
    intro: [
      "El Núcleo lleva días en silencio. Nadie entra, nadie sale, y los procesos que quedaban dentro empezaron a torcerse.",
      "Despiertas en /home sin saber cómo llegaste. No hay ventanas, ni iconos, ni ratón. Solo una línea que parpadea esperando.",
      "Tux te mira desde el borde de la pantalla. «Antes de arreglar nada», dice, «aprende a caminar: mira dónde estás y muévete.»",
    ],
    outro: "Ya no estás perdido. Sabes dónde pisas y cómo llegar a otro sitio, que es por donde se empieza todo.",
    enemies: ["bicho"],
    waves: 8,
  },
  {
    topic: "archivos",
    act: 1,
    title: "El taller de archivos",
    place: "/var/taller",
    lesson: "Crear, copiar, mover y borrar sin romper nada.",
    intro: [
      "Al final del pasillo hay un taller lleno de archivos a medio escribir, copias duplicadas y carpetas sin nombre.",
      "«El desorden también es un fallo», gruñe Tux. «Aquí se aprende a tocar las cosas sin romperlas.»",
      "Un bicho mordisquea un archivo de configuración. Te mira. Escribe rápido.",
    ],
    outro: "El taller vuelve a estar en orden. Has aprendido lo más peligroso de la terminal: borrar, y hacerlo a propósito.",
    enemies: ["bicho", "zombi"],
    waves: 10,
  },
  {
    topic: "paquetes",
    act: 1,
    title: "El almacén de paquetes",
    place: "El depósito del gestor",
    lesson: "Instalar, actualizar y quitar programas con tu gestor.",
    intro: [
      "El almacén está reventado. Cajas abiertas, dependencias sueltas, media instalación a medio terminar por todas partes.",
      "«Cada familia tiene su propia llave para este almacén», dice Tux. «La tuya la aprendes aquí.»",
      "Algo grande se mueve al fondo. El suelo tiembla.",
    ],
    outro: "El almacén responde otra vez. Con un gestor de paquetes en las manos ya puedes construir, no solo reparar.",
    enemies: ["bicho", "roto"],
    boss: "panico",
    waves: 12,
  },
  {
    topic: "permisos",
    act: 2,
    title: "La puerta de permisos",
    place: "La frontera de /etc",
    lesson: "Quién puede leer, escribir y ejecutar.",
    intro: [
      "Una puerta de hierro cierra el paso a /etc. No tiene cerradura: tiene permisos.",
      "«Aquí abajo nadie entra por ser quien es», avisa Tux. «Se entra por lo que te dejan hacer. Y eso se lee y se cambia.»",
      "Del otro lado se oye algo arrastrarse.",
    ],
    outro: "La puerta cede. Entiendes quién manda sobre cada archivo, y eso es media seguridad del sistema.",
    enemies: ["bicho", "zombi", "huerfano"],
    waves: 12,
  },
  {
    topic: "busqueda",
    act: 2,
    title: "El laberinto de datos",
    place: "Los archivos profundos",
    lesson: "Encontrar un archivo y una línea entre millones.",
    intro: [
      "Debajo de /etc se abre un laberinto de carpetas que nadie ha recorrido entero. Hay registros de hace veinte años.",
      "«Lo que buscas está aquí», dice Tux. «Lo que no sabes es dónde. Y mirar carpeta por carpeta te llevaría la vida.»",
      "Algo gotea en la oscuridad y cada gota se mueve más rápido que la anterior.",
    ],
    outro: "Ya no buscas a ciegas. Puedes encontrar cualquier cosa en el sistema, que es lo que separa a quien usa la terminal de quien la sufre.",
    enemies: ["bicho", "fuga"],
    waves: 12,
  },
  {
    topic: "sistema",
    act: 2,
    title: "La sala de máquinas",
    place: "El corazón del Núcleo",
    lesson: "Disco, memoria y qué equipo tienes debajo.",
    intro: [
      "La sala de máquinas está caliente. Los discos giran al límite y la memoria no para de llenarse.",
      "«Para arreglar algo primero hay que medirlo», dice Tux. «Aquí aprendes a mirar las tripas de tu propia máquina.»",
      "En la pared, un contador sube solo. No debería.",
    ],
    outro: "Ahora sabes leer el estado de tu máquina. Cuando algo va mal, dejas de adivinar.",
    enemies: ["zombi", "fuga", "roto"],
    boss: "bucle",
    waves: 14,
  },
  {
    topic: "procesos",
    act: 3,
    title: "Los procesos fantasma",
    place: "La tabla de procesos",
    lesson: "Ver qué se está ejecutando y pararlo.",
    intro: [
      "Hay procesos que terminaron hace meses y siguen ocupando sitio. Nadie los lanzó. Nadie puede cerrarlos.",
      "«Esto ya no es ordenar», dice Tux, y por primera vez no suena tranquilo. «Esto es echar a alguien de tu casa.»",
      "Uno de ellos se gira hacia ti y repite tu nombre de usuario.",
    ],
    outro: "La tabla de procesos vuelve a tener sentido. Nada se ejecuta en tu sistema sin que puedas verlo y detenerlo.",
    enemies: ["bicho", "zombi", "fuga", "huerfano"],
    waves: 14,
  },
  {
    topic: "servicios",
    act: 3,
    title: "Los servicios dormidos",
    place: "La sala de systemd",
    lesson: "Arrancar, parar y consultar servicios.",
    intro: [
      "Doce servicios deberían estar en marcha. Solo responden tres, y uno de ellos miente sobre su estado.",
      "«Un servicio no es un programa que abres», explica Tux. «Es uno que el sistema mantiene vivo por ti. Si sabes hablarles, el Núcleo vuelve.»",
      "Las luces de la sala parpadean en un orden que no es casual.",
    ],
    outro: "Los servicios responden. El Núcleo empieza a respirar por su cuenta.",
    enemies: ["bicho", "zombi", "fuga", "roto", "huerfano"],
    boss: "disco",
    waves: 16,
  },
  {
    topic: "redes",
    act: 3,
    title: "El puente de red",
    place: "La salida del Núcleo",
    lesson: "Conectividad, puertos y acceso remoto.",
    intro: [
      "El último tramo es un puente de paquetes que no llegan a ninguna parte. El Núcleo lleva días sin hablar con el mundo.",
      "«Falta una cosa», dice Tux. «Un sistema aislado está a salvo y está muerto. Hay que abrirlo, y hacerlo bien.»",
      "Al otro lado del puente hay alguien esperando. Lleva esperando desde el principio.",
    ],
    outro:
      "El Núcleo vuelve a estar en pie, y tú ya no eres quien despertó en /home sin saber dónde estaba. Ahora la terminal es tuya.",
    enemies: ["bicho", "zombi", "fuga", "roto", "huerfano"],
    boss: "root",
    waves: 18,
  },
];

export const ACTS: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Acto I · Los primeros pasos", subtitle: "Moverte, tocar archivos y traer programas." },
  2: { title: "Acto II · Bajo la superficie", subtitle: "Permisos, búsqueda y las tripas de la máquina." },
  3: { title: "Acto III · El Núcleo", subtitle: "Procesos, servicios y la salida al mundo." },
};

/** Lo que distingue a cada enemigo dentro de la batalla. */
export interface EnemyKind {
  id: EnemyId;
  name: string;
  /** Lo que hace, para la pantalla de ayuda. */
  trait: string;
  /** Velocidad relativa al resto. */
  speed: number;
  /** Comandos que hay que escribir para derribarlo. */
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
  /** Lo que grita al aparecer. */
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
export const storyKey = (topic: string) => `historia:${topic}`;
/** Monedas por enemigo derribado. */
export const COINS_PER_KILL = 4;
