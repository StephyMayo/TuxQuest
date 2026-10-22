/**
 * Guías de cada distribución: retrato de cuerpo completo en pixel art.
 * Todas comparten el mismo dibujo base (40x89) y se distinguen por la
 * paleta de la marca y el accesorio: sombrero para la familia Red Hat,
 * prendedor en el cabello para el resto.
 */
import { mascotFor, phraseFor, OUTFIT, type Accessory, type MascotPalette } from "@/data/mascots";
import { Sprite, type Palette } from "./Pixel";

// . transparente · K contorno · H cabello · h brillo del cabello
// S piel · s sombra de la piel · E blanco del ojo · I iris · W brillo
// M boca · N bufanda · T top corto · D falda · d vuelo de la falda
// B bota · b suela · A accesorio
const BASE = [
  "..............KKKKKKKKKK................",
  "...........KKKhhhhhhhhhhKKK.............",
  ".........KKhhHHHHHHHHHHHHHHhhKK.........",
  "........KhhHHHHHHHHHHHHHHHHHHhhK........",
  ".......KhHHHHHHHHHHHHHHHHHHHHHHhK.......",
  ".......KHHHHHHHHHHHHHHHHHHHHHHHHK.......",
  "......KHHHHHHHHHHHHHHHHHHHHHHHHHHK......",
  "......KHHHHHHHHHHHHHHHHHHHHHHHHHHK......",
  "......KHHHHSSSSSSSSSSSSSSSSSSHHHHK......",
  "......KHHHSSSSSSSSSSSSSSSSSSSSHHHK......",
  "......KHHHSSSSSSSSSSSSSSSSSSSSHHHK......",
  "......KHHHSSKKKKKSSSSSSKKKKKSSHHHK......",
  "......KHHHSSKIIWKSSSSSSKIIWKSSHHHK......",
  "......KHHHSSKIIIKSSSSSSKIIIKSSHHHK......",
  "......KHHHSSKEEIKSSSSSSKEEIKSSHHHK......",
  "......KHHHSSSKKKSSSSSSSSKKKSSSHHHK......",
  "......KHHHSSSSSSSSSSSSSSSSSSSSHHHK......",
  "......KHHHSSSSSSSSSSSSSSSSSSSSHHHK......",
  "......KHHHSSSSSSSSSMMMSSSSSSSSHHHK......",
  "......KHHHHSSSSSSSSSSSSSSSSSSHHHHK......",
  ".......KHHHHSSSSSSSSSSSSSSSSHHHHK.......",
  ".......KHHHHHSSSSSSSSSSSSSSHHHHHK.......",
  "........KHHHHHSSSSSSSSSSSSHHHHHK........",
  "........KHHHHHHHHSSSSSSHHHHHHHHK........",
  "........KHHHHHNNNNNNNNNNNNHHHHHK........",
  "........KHHHHNNNNNNNNNNNNNNHHHHK........",
  ".........KHHHNNNNNNNNNNNNNNHHHK.........",
  "..........KHNNNNNNNNNNNNNNNNHK..........",
  ".....NNNNKSSSKTTTTTTTTTTTTKSSSK.........",
  "...NNNNNKSSSKTTTTTTTTTTTTTTKSSSK........",
  ".NNNNNNKSSSKTTTTTTTTTTTTTTTTKSSSK.......",
  "NNNNN.KSSSKKTTTTTTTTTTTTTTTTKKSSSK......",
  "NNNN.KSSSK.KTTTTTTTTTTTTTTTTK.KSSSK.....",
  ".NNN.KSSSK.KTTTTTTTTTTTTTTTTK.KSSSK.....",
  ".....KSSSK.KTTTTTTTTTTTTTTTK..KSSSK.....",
  "......KSSSK.KKKKKKKKKKKKKKKK.KSSSK......",
  "......KSSSK.KSSSSSSSSSSSSSK..KSSSK......",
  ".......KSSSK.KSSSSSSSSSSSSK.KSSSK.......",
  "........KSSSKKSSSSSSSSSSSK.KSSSK........",
  ".........KSSSKKSSSSSSSSSSKKSSSK.........",
  "..........KSSSKSSSSSSSSSSKSSSK..........",
  "...........KSSSKSSSSSSSSKSSSK...........",
  "............KSSSKSSSSSSKSSSK............",
  "............KDDDDDDDDDDDDDDK............",
  "...........KDDDDDDDDDDDDDDDDK...........",
  "..........KDDDDDDDDDDDDDDDDDDK..........",
  ".........KDDDDDDDDDDDDDDDDDDDDK.........",
  "........KDDDDDDDDDDDDDDDDDDDDDDK........",
  ".......KDDDDDDDDDDDDDDDDDDDDDDDDK.......",
  "......KddddddddddddddddddddddddddK......",
  "......KddddddddddddddddddddddddddK......",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "...........KSSSSSSK..KSSSSSSK...........",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  "............KSSSSSK..KSSSSSK............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KSSSSK..KSSSSK.............",
  ".............KbbbbK..KbbbbK.............",
  ".............KbbbbK..KbbbbK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  ".............KBBBBK..KBBBBK.............",
  "............KBBBBBK..KBBBBBK............",
  "............KBBBBBK..KBBBBBK............",
  "............KKKKKKK..KKKKKKK............",
];

/**
 * Sombrero de ala ancha para la familia Red Hat. Sustituye las cinco
 * primeras filas del cabello para que se apoye en la cabeza y no flote.
 */
const HAT = [
  "..............KKKKKKKKKK................",
  ".............KAAAAAAAAAAK...............",
  ".............KAAAAAAAAAAK...............",
  "............KAAAAAAAAAAAAK..............",
  "............KAAAAAAAAAAAAK..............",
  "...........KAAAAAAAAAAAAAAK.............",
  "........KKKKKKKKKKKKKKKKKKKKK...........",
  "....KAAAAAAAAAAAAAAAAAAAAAAAAAAAAK......",
  "...KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK.....",
  "....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK......",
];

/**
 * Prendedor en el cabello, para el resto de distribuciones. Va en blanco
 * porque el color de la marca suele ser el mismo del cabello y no se vería.
 */
const CLIP: Record<number, string> = {
  3: "........KhhWWWHHHHHHHHHHHHHHHhhK........",
  4: ".......KhHHWWWHHHHHHHHHHHHHHHHHhK.......",
};

function mapFor(accessory: Accessory) {
  if (accessory === "sombrero") return [...HAT, ...BASE.slice(6)];
  return BASE.map((row, i) => CLIP[i] ?? row);
}

function paletteFor(p: MascotPalette): Palette {
  return {
    K: "#06030f",
    H: p.hair,
    h: p.hairDark,
    S: OUTFIT.skin,
    s: OUTFIT.skinShade,
    E: "#ffffff",
    I: p.iris,
    W: "#ffffff",
    M: "#c4576b",
    N: p.accent,
    T: OUTFIT.top,
    D: OUTFIT.skirt,
    d: OUTFIT.skirtTrim,
    B: OUTFIT.boot,
    b: p.iris,
    A: p.accent,
  };
}

/** Retrato de cuerpo completo de la guía de una distribución. */
export function PixelMascot({
  distroId,
  size = 104,
  className = "",
  bob = false,
}: {
  distroId: string;
  /** Ancho en píxeles; el alto sale de la proporción del dibujo. */
  size?: number;
  className?: string;
  bob?: boolean;
}) {
  const m = mascotFor(distroId);
  return (
    <Sprite
      map={mapFor(m.accessory)}
      palette={paletteFor(m.palette)}
      size={size}
      className={`${bob ? "bob" : ""} ${className}`}
      title={`${m.name}, ${m.role}`}
    />
  );
}

/**
 * La guía de la distribución explicando el fallo: la chica de cuerpo
 * entero a un lado y el bocadillo con el texto del reto al otro.
 */
export function MascotTip({
  distroId,
  timedOut,
  seed,
  children,
}: {
  distroId: string;
  timedOut: boolean;
  /** Número estable (el índice del reto) para que la frase no cambie al re-renderizar. */
  seed: number;
  children: React.ReactNode;
}) {
  const m = mascotFor(distroId);
  const phrase = phraseFor(m, timedOut, seed);
  return (
    <div className="mt-4 flex items-start gap-3">
      <div className="w-[92px] shrink-0 text-center sm:w-[108px]">
        <PixelMascot distroId={distroId} size={104} bob className="mx-auto w-full" />
        <p className="mt-1 font-pixel text-[9px] leading-tight" style={{ color: m.palette.iris }}>
          {m.name.toUpperCase()}
        </p>
        <p className="font-game text-sm leading-tight text-muted">{m.role}</p>
      </div>

      <div className="card-flat relative flex-1 p-3">
        {/* punta del bocadillo */}
        <span
          className="absolute -left-[10px] top-5 h-0 w-0 border-y-[8px] border-r-[10px] border-y-transparent"
          style={{ borderRightColor: "var(--panel-2)" }}
          aria-hidden="true"
        />
        <p className="font-game text-lg leading-snug" style={{ color: m.palette.iris }}>
          {phrase}
        </p>
        <p className="mt-1.5 text-muted">{children}</p>
      </div>
    </div>
  );
}
