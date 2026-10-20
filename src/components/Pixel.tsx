/** Sprites pixel art dibujados en SVG a partir de mapas de caracteres. */

type Palette = Record<string, string>;

function Sprite({ map, palette, size, className = "", title }: { map: string[]; palette: Palette; size: number; className?: string; title?: string }) {
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

/** Insignia pixel de familia con su inicial. */
export function FamilyBadge({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center border-[3px] border-ink font-pixel text-[13px] text-white"
      style={{ width: size, height: size, background: color, boxShadow: "inset -3px -3px 0 #00000055, inset 3px 3px 0 #ffffff40, 3px 3px 0 #06030f", textShadow: "2px 2px 0 #06030f" }}
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  );
}
