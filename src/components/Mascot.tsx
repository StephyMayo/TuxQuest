/**
 * Guías de cada distribución: retrato de cuerpo completo en pixel art.
 * Todas comparten el mismo dibujo base (32x67) y se distinguen por la
 * paleta de la marca y el accesorio: sombrero para la familia Red Hat,
 * prendedor en el cabello para el resto.
 */
import { mascotFor, phraseFor, OUTFIT, type Accessory, type MascotPalette } from "@/data/mascots";
import { Sprite, type Palette } from "./Pixel";

// . transparente · K contorno · H cabello · h sombra del cabello · S piel
// E blanco del ojo · I iris · W blanco (brillo del ojo, cuello, prendedor)
// M boca · C camisa · c brillo de la camisa · T corbata · D falda
// L medias · l borde de las medias · R zapatos · A accesorio
const BASE = [
  "........KKKKKKKKKKKKKKKK........",
  "......KKhhhhhhhhhhhhhhhhKK......",
  ".....KhhHHHHHHHHHHHHHHHHhhK.....",
  ".....KHHHHHHHHHHHHHHHHHHHHK.....",
  "....KHHHHHHHHHHHHHHHHHHHHHHK....",
  "....KHHHSSSSSSSSSSSSSSSSHHHK....",
  "....KHHSSSSSSSSSSSSSSSSSSHHK....",
  "....KHHSSSSSSSSSSSSSSSSSSHHK....",
  "....KHHSSKKKKSSSSSSKKKKSSHHK....",
  "....KHHSSKIWKSSSSSSKIWKSSHHK....",
  "....KHHSSKIIKSSSSSSKIIKSSHHK....",
  "....KHHSSKIEKSSSSSSKIEKSSHHK....",
  "....KHHSSSKKSSSSSSSSKKSSSHHK....",
  "....KHHSSSSSSSSSSSSSSSSSSHHK....",
  "....KHHSSSSSSSSMMSSSSSSSSHHK....",
  "....KHHSSSSSSSSSSSSSSSSSSHHK....",
  "....KHHHSSSSSSSSSSSSSSSSHHHK....",
  ".....KHHHSSSSSSSSSSSSSSHHHK.....",
  ".....KHHHHSSSSSSSSSSSSHHHHK.....",
  "......KHHHHSSSSSSSSSSHHHHK......",
  ".....KHHHHHHHSSSSSSHHHHHHHK.....",
  ".....KHHHHHHHSSSSSSHHHHHHHK.....",
  ".....KHHKKCCCWWTTWWCCCKKHHK.....",
  ".....KHHKKCCCCWTTWCCCCKKHHK.....",
  ".....KHHKKCCCCCTTCCCCCKKHHK.....",
  ".....KHHKKCCcCCTTCCcCCKKHHK.....",
  ".....KHHKKCcCCCTTCCCcCKKHHK.....",
  ".....KHHKKCCCCCTTCCCCCKKHHK.....",
  ".....KHHKKCCCCCTTCCCCCKKHHK.....",
  ".....KHHKKCCCCCTTCCCCCKKHHK.....",
  ".....KHHK.KCCCCTTCCCCK.KHHK.....",
  ".....KHHK..KCCCTTCCCK..KHHK.....",
  ".....KHHK...KCCTTCCK...KHHK.....",
  ".....KHHK...KCCTTCCK...KHHK.....",
  ".....KHHK...KKKKKKKK...KHHK.....",
  "......KHK..KDDDDDDDDK...KHK.....",
  ".......KK.KDDDDDDDDDDK...KK.....",
  ".........KDDDDDDDDDDDDK.........",
  "........KDDDDDDDDDDDDDDK........",
  ".......KDDDDDDDDDDDDDDDDK.......",
  "......KDDDDDDDDDDDDDDDDDDK......",
  "......KDDDDDDDDDDDDDDDDDDK......",
  "......KKKKKKKKKKKKKKKKKKKK......",
  ".........KSSSSK..KSSSSK.........",
  ".........KSSSSK..KSSSSK.........",
  ".........KllllK..KllllK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLLK..KLLLLK.........",
  ".........KLLLK....KLLLK.........",
  ".........KLLLK....KLLLK.........",
  ".........KLLLK....KLLLK.........",
  ".........KLLLK....KLLLK.........",
  ".........KLLLK....KLLLK.........",
  ".........KLLLK....KLLLK.........",
  "..........KLLK....KLLK..........",
  "..........KLLK....KLLK..........",
  "..........KLLK....KLLK..........",
  ".........KRRRK....KRRRK.........",
  ".........KRRRK....KRRRK.........",
  "........RRRRRR....RRRRRR........",
  "............RR....RR............",
];

/**
 * Sombrero de ala ancha para la familia Red Hat. Sustituye las cinco
 * primeras filas del cabello para que se apoye en la cabeza y no flote.
 */
const HAT = [
  "..........KKKKKKKKKKKK..........",
  ".........KAAAAAAAAAAAAK.........",
  ".........KAAAAAAAAAAAAK.........",
  "........KAAAAAAAAAAAAAAK........",
  "........KAAAAAAAAAAAAAAK........",
  ".......KAAAAAAAAAAAAAAAAK.......",
  ".....KKKKKKKKKKKKKKKKKKKKKK.....",
  "..KAAAAAAAAAAAAAAAAAAAAAAAAAAK..",
  ".KAAAAAAAAAAAAAAAAAAAAAAAAAAAAK.",
  "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
];

/**
 * Prendedor en el cabello, para el resto de distribuciones. Va en blanco
 * porque el color de la marca suele ser el mismo del cabello y no se vería.
 */
const CLIP: Record<number, string> = {
  3: ".....KHHWWWHHHHHHHHHHHHHHHK.....",
  4: "....KHHHWWWHHHHHHHHHHHHHHHHK....",
};

function mapFor(accessory: Accessory) {
  if (accessory === "sombrero") return [...HAT, ...BASE.slice(4)];
  return BASE.map((row, i) => CLIP[i] ?? row);
}

function paletteFor(p: MascotPalette): Palette {
  return {
    K: "#06030f",
    H: p.hair,
    h: p.hairDark,
    S: "#f2c9a0",
    E: "#ffffff",
    I: p.iris,
    W: "#f3efff",
    M: "#c4576b",
    C: OUTFIT.shirt,
    c: OUTFIT.shirtLight,
    D: OUTFIT.skirt,
    L: OUTFIT.stocking,
    l: OUTFIT.stockingBand,
    T: p.iris,
    A: p.accent,
    R: p.iris,
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
