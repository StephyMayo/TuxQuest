/**
 * Retrato pixel art de las guías de cada distribución.
 * Todas comparten el mismo dibujo base (24x30) y se distinguen por la
 * paleta de la marca y el accesorio: sombrero para la familia Red Hat,
 * prendedor en el cabello para el resto.
 */
import { mascotFor, phraseFor, SHIRT_COLORS, type Accessory, type MascotPalette } from "@/data/mascots";
import { Sprite, type Palette } from "./Pixel";

// . transparente · K contorno · H cabello · h brillo del cabello · S piel
// E blanco del ojo · I iris · W brillo del ojo y cuello · M boca
// C ropa · T corbata · A accesorio
const BASE = [
  "..........KKKKKKKK..........",
  "........KKhhhhhhhhKK........",
  "......KKhhHHHHHHHHhhKK......",
  ".....KhhHHHHHHHHHHHHhhK.....",
  "....KhhHHHHHHHHHHHHHHhhK....",
  "....KHHHHHHHHHHHHHHHHHHK....",
  "...KHHHHHSSSSSSSSSSHHHHHK...",
  "...KHHHHSSSSSSSSSSSSHHHHK...",
  "...KHHHSSSSSSSSSSSSSSHHHK...",
  "...KHHHSSSSSSSSSSSSSSHHHK...",
  "...KHHHSKKKKSSSSKKKKSHHHK...",
  "...KHHHSKIWKSSSSKIWKSHHHK...",
  "...KHHHSKIEKSSSSKIEKSHHHK...",
  "...KHHHSSKKSSSSSSKKSSHHHK...",
  "...KHHHSSSSSSSSSSSSSSHHHK...",
  "...KHHHSSSSSSSSSSSSSSHHHK...",
  "...KHHHSSSSSSMMSSSSSSHHHK...",
  "...KHHHSSSSSSSSSSSSSSHHHK...",
  "....KHHHSSSSSSSSSSSSHHHK....",
  "....KHHHHSSSSSSSSSSHHHHK....",
  "....KHHHHHSSSSSSSSHHHHHK....",
  "...KHHHHHHHSSSSSSHHHHHHHK...",
  "..KHHHHHHWWSSTTSSWWHHHHHHK..",
  "..KHHHHHWWCCCTTCCCWWHHHHHK..",
  "..KHHHHWWCCCCTTCCCCWWHHHHK..",
  "..KHHHHCCCCCCTTCCCCCCHHHHK..",
  "..KHHHCCCCCCCTTCCCCCCCHHHK..",
  "..KHHHCCCCCCCTTCCCCCCCHHHK..",
  "..KHHCCCCCCCCTTCCCCCCCCHHK..",
  "..KHHCCCCCCCCTTCCCCCCCCHHK..",
  "..KHHCCCCCCCCTTCCCCCCCCHHK..",
  "..KHCCCCCCCCCCCCCCCCCCCCHK..",
  "..KCCCCCCCCCCCCCCCCCCCCCCK..",
  "..KKKKKKKKKKKKKKKKKKKKKKKK..",
];

/**
 * Sombrero de ala ancha para la familia Red Hat. Sustituye las cuatro
 * primeras filas del cabello para que se apoye en la cabeza y no flote.
 */
const HAT = [
  ".........KKKKKKKKKK.........",
  "........KAAAAAAAAAAK........",
  "........KAAAAAAAAAAK........",
  ".......KAAAAAAAAAAAAK.......",
  ".......KAAAAAAAAAAAAK.......",
  "......KAAAAAAAAAAAAAAK......",
  "......KAAAAAAAAAAAAAAK......",
  "....KKKKKKKKKKKKKKKKKKKK....",
  "..KAAAAAAAAAAAAAAAAAAAAAAK..",
  ".KAAAAAAAAAAAAAAAAAAAAAAAAK.",
  "..KKKKKKKKKKKKKKKKKKKKKKKK..",
];

/**
 * Prendedor en el cabello, para el resto de distribuciones. Va en blanco
 * porque el color de la marca suele ser el mismo del cabello y no se vería.
 */
const CLIP: Record<number, string> = {
  3: ".....KhhWWWHHHHHHHHHhhK.....",
  4: "....KhhWWWHHHHHHHHHHHhhK....",
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
    M: "#c4576b",
    C: SHIRT_COLORS.cloth,
    c: SHIRT_COLORS.clothDark,
    W: "#f3efff",
    T: p.accent,
    A: p.accent,
  };
}

/** Retrato de la guía de una distribución. */
export function PixelMascot({
  distroId,
  size = 96,
  className = "",
  bob = false,
}: {
  distroId: string;
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
      title={`${m.name}, ${m.role} de ${distroId}`}
    />
  );
}

/**
 * La guía de la distribución explicando el fallo: retrato + bocadillo.
 * El texto del reto se pasa como children.
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
      <div className="w-[76px] shrink-0 text-center">
        <PixelMascot distroId={distroId} size={72} bob />
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
