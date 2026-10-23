/** Sprites pixel art dibujados en SVG a partir de mapas de caracteres. */

export type Palette = Record<string, string>;

export function Sprite({ map, palette, size, className = "", title }: { map: string[]; palette: Palette; size: number; className?: string; title?: string }) {
  const w = map[0].length;
  const h = map.length;
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = palette[row[x]];
      if (c) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={c} />);
    }
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      className={`pixelated ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

const TUX_MAP = [
  "......KKKKKK......",
  ".....KKKKKKKK.....",
  "....KWWWKKWWWK....",
  "....KWKWKKWKWK....",
  "....KWWWKKWWWK....",
  "....KKKYYYYKKK....",
  "....KKYYYYYYKK....",
  "...KKKKOOOOKKKK...",
  "..KKKWWWWWWWWKKK..",
  ".KKKWWWWWWWWWWKKK.",
  ".KKWWWWWWWWWWWWKK.",
  "KKKWWWWWWWWWWWWKKK",
  "KKKWWWWWWWWWWWWKKK",
  ".KKWWWWWWWWWWWWKK.",
  ".KKKWWWWWWWWWWKKK.",
  "..KKKWWWWWWWWKKK..",
  "..YYYYKKKKKKYYYY..",
  ".YYYYYY....YYYYYY.",
];
const TUX_PAL: Palette = { K: "#16121f", W: "#f6f2e7", Y: "#ffb627", O: "#e07b00" };

export function PixelTux({ size = 48, className = "", bob = false }: { size?: number; className?: string; bob?: boolean }) {
  return <Sprite map={TUX_MAP} palette={TUX_PAL} size={size} className={`${bob ? "bob" : ""} ${className}`} />;
}

const COIN_MAP = ["..KKKK..", ".KYYYYK.", "KYWYYOYK", "KYWYYOYK", "KYYYYOYK", "KYYYYOYK", ".KYOOYK.", "..KKKK.."];
const COIN_PAL: Palette = { K: "#2a1a00", Y: "#ffd23f", W: "#fff6c9", O: "#e0a100" };

export function PixelCoin({ size = 18, className = "" }: { size?: number; className?: string }) {
  return <Sprite map={COIN_MAP} palette={COIN_PAL} size={size} className={className} />;
}

const STAR_MAP = ["....K....", "...KYK...", "...KYK...", "KKKYYYKKK", "KYYYWYYYK", ".KYYYYYK.", "..KYYYK..", ".KYYKYYK.", "KYK...KYK", "KK.....KK"];

export function PixelStar({ size = 22, filled = true, className = "" }: { size?: number; filled?: boolean; className?: string }) {
  const pal: Palette = filled ? { K: "#2a1a00", Y: "#ffd23f", W: "#fff6c9" } : { K: "#06030f", Y: "#3d3270", W: "#3d3270" };
  return <Sprite map={STAR_MAP} palette={pal} size={size} className={className} />;
}

export function Stars({ count, size = 22 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${count} de 3 estrellas`}>
      {[0, 1, 2].map((i) => (
        <PixelStar key={i} filled={i < count} size={size} />
      ))}
    </span>
  );
}

/** 0-3 estrellas según el porcentaje de aciertos. */
export const starsFor = (ratio: number) => (ratio >= 1 ? 3 : ratio >= 0.85 ? 2 : ratio >= 0.7 ? 1 : 0);

const HEART_MAP = [".KK.KK.", "KRRKRRK", "KRWRRRK", "KRRRRRK", ".KRRRK.", "..KRK..", "...K..."];

export function PixelFire({ size = 16 }: { size?: number }) {
  const map = ["...K...", "..KOK..", ".KOYOK.", ".KOYOK.", "KOYWYOK", "KOYYYOK", ".KOOOK."];
  return <Sprite map={map} palette={{ K: "#2b0a00", O: "#ff6b1a", Y: "#ffd23f", W: "#fff6c9" }} size={size} />;
}

export function PixelHeart({ size = 16 }: { size?: number }) {
  return <Sprite map={HEART_MAP} palette={{ K: "#2b0010", R: "#ff5d8f", W: "#ffd1e0" }} size={size} />;
}

const CLOCK_MAP = [".KKKKK.", "KWWKWWK", "KWWKWWK", "KWWKKWK", "KWWWWWK", "KWWWWWK", ".KKKKK."];
export function PixelClock({ size = 16 }: { size?: number }) {
  return <Sprite map={CLOCK_MAP} palette={{ K: "#06030f", W: "#c9f7ff" }} size={size} />;
}

const BULB_MAP = [".KKKK.", "KYYWYK", "KYYYYK", "KYYYYK", ".KYYK.", ".KGGK.", "..KK.."];
export function PixelBulb({ size = 14 }: { size?: number }) {
  return <Sprite map={BULB_MAP} palette={{ K: "#2a1a00", Y: "#ffd23f", W: "#fff6c9", G: "#9a92b8" }} size={size} />;
}

const LOCK_MAP = ["..KKK..", ".K...K.", ".K...K.", "KKKKKKK", "KGGKGGK", "KGGGGGK", "KKKKKKK"];
export function PixelLock({ size = 16 }: { size?: number }) {
  return <Sprite map={LOCK_MAP} palette={{ K: "#06030f", G: "#9a92b8" }} size={size} />;
}

/** Paisaje pixel: montañas nevadas e icebergs (decorativo). */
export function PixelLandscape({ className = "" }: { className?: string }) {
  const W = 160;
  const cols = Array.from({ length: W }, (_, x) => {
    const far = Math.round(20 + 8 * Math.sin(x / 9) + 5 * Math.sin(x / 4.3 + 1));
    const near = Math.round(30 + 5 * Math.sin(x / 6 + 2) + 3 * Math.sin(x / 2.7));
    return { far, near };
  });
  return (
    <svg viewBox={`0 0 ${W} 48`} className={`pixelated w-full ${className}`} preserveAspectRatio="none" aria-hidden="true">
      {cols.map(({ far, near }, x) => (
        <g key={x}>
          <rect x={x} y={far} width={1.05} height={48 - far} fill="#3a2f78" />
          <rect x={x} y={far} width={1.05} height={2} fill="#c9c2f0" />
          <rect x={x} y={near} width={1.05} height={48 - near} fill="#251c52" />
          <rect x={x} y={near} width={1.05} height={1} fill="#8f86d0" />
        </g>
      ))}
      <rect x="0" y="42" width={W} height="6" fill="#1a1236" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={i * 8 + (i % 3)} y={44 + (i % 2)} width={3} height={1} fill="#3be8ff55" />
      ))}
    </svg>
  );
}


// ---------------------------------------------------------------------------
// Avatares de la tienda: variantes del sprite de Tux (paleta + accesorios)
// ---------------------------------------------------------------------------

const GOLD_PAL: Palette = { K: "#3a2a00", W: "#ffd23f", Y: "#fff6c9", O: "#e0a100", C: "#06030f", R: "#ff5d8f" };
const GHOST_PAL: Palette = { K: "#2b2450", W: "#b9c7ff", Y: "#8f86d0", O: "#6a5fb0", C: "#06030f", R: "#ff5d8f" };
const NINJA_PAL: Palette = { K: "#06030f", W: "#4a4268", Y: "#ffb627", O: "#e07b00", C: "#3be8ff", R: "#ff5c6c" };
const BASE_PAL: Palette = { ...TUX_PAL, C: "#3be8ff", R: "#ff5c6c" };

/** Devuelve el mapa con algunas filas sustituidas. */
const withRows = (map: string[], rows: Record<number, string>) => map.map((r, i) => rows[i] ?? r);

const CROWN = [".....C..C..C......", "....CCCCCCCCC....."];
const SHADES = { 2: "....KCCCCCCCCK....", 3: "....KCCCCCCCCK....", 4: "....KKKKKKKKKK...." };
const BAND = { 1: "....RRRRRRRRRR....", 2: "....KWWWKKWWWK.RR.", 3: "....KWKWKKWKWK..R." };

interface AvatarSkin {
  map: string[];
  palette: Palette;
}

const AVATAR_SKINS: Record<string, AvatarSkin> = {
  tux: { map: TUX_MAP, palette: BASE_PAL },
  tux_shades: { map: withRows(TUX_MAP, SHADES), palette: BASE_PAL },
  tux_ninja: { map: withRows(TUX_MAP, BAND), palette: NINJA_PAL },
  tux_king: { map: [...CROWN, ...TUX_MAP], palette: { ...BASE_PAL, C: "#ffd23f" } },
  tux_gold: { map: TUX_MAP, palette: GOLD_PAL },
  tux_ghost: { map: TUX_MAP, palette: GHOST_PAL },
};

export const avatarIds = () => Object.keys(AVATAR_SKINS);

/** Avatar del jugador. Si el id no existe, cae en el Tux clásico. */
export function PixelAvatar({ id, size = 48, className = "", bob = false, title }: { id: string; size?: number; className?: string; bob?: boolean; title?: string }) {
  const skin = AVATAR_SKINS[id] ?? AVATAR_SKINS.tux;
  return <Sprite map={skin.map} palette={skin.palette} size={size} className={`${bob ? "bob" : ""} ${className}`} title={title} />;
}

const BAG_MAP = ["..KK..KK..", ".K..KK..K.", "KKKKKKKKKK", "KYYYYYYYYK", "KYYKYYKYYK", "KYYYYYYYYK", "KYYKKKKYYK", "KYYYYYYYYK", "KKKKKKKKKK"];
/** Icono de la tienda. */
export function PixelBag({ size = 18, className = "" }: { size?: number; className?: string }) {
  return <Sprite map={BAG_MAP} palette={{ K: "#2a1a00", Y: "#ffd23f" }} size={size} className={className} />;
}

const SHIELD_MAP = ["KKKKKKKK", "KCCCCCCK", "KCCWWCCK", "KCCWWCCK", "KCCCCCCK", ".KCCCCK.", "..KCCK..", "...KK..."];
/** Icono del boost escudo. */
export function PixelShield({ size = 16, className = "" }: { size?: number; className?: string }) {
  return <Sprite map={SHIELD_MAP} palette={{ K: "#06222a", C: "#3be8ff", W: "#eafdff" }} size={size} className={className} />;
}
