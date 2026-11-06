import { Sprite, type Palette } from "./Pixel";

interface Logo {
  map: string[];
  palette: Palette;
}

const DEBIAN: Logo = {
  map: [
    "................",
    "......RRRRR.....",
    "....RRRRRRRRR...",
    "...RRR.....RRR..",
    "..RRR...RRR..RR.",
    "..RR..RRRRRR..R.",
    ".RR..RRR...RR...",
    ".RR.RR......R...",
    ".RR.RR..........",
    ".RR.RRR.........",
    ".RR..RRR........",
    "..RR...RRR......",
    "..RRR.....RR....",
    "...RRR..........",
    "....RRRR........",
    "......RR........",
  ],
  palette: { R: "#d70751" },
};

const ARCH: Logo = {
  map: [
    ".......BB.......",
    ".......BB.......",
    "......BBBB......",
    "......BBBB......",
    ".....BBBBBB.....",
    ".....BB..BB.....",
    "....BBB..BBB....",
    "....BB....BB....",
    "...BBB....BBB...",
    "...BB......BB...",
    "..BBB..BB..BBB..",
    "..BB..BBBB..BB..",
    ".BBB.BB..BB.BBB.",
    ".BB.BB....BB.BB.",
    "BBBBB......BBBBB",
    "BBB..........BBB",
  ],
  palette: { B: "#1793d1" },
};

const REDHAT: Logo = {
  map: [
    "................",
    "................",
    "................",
    "....RRR..RRR....",
    "....RRRRRRRR....",
    "....RRRRRRRR....",
    "....RRRRRRRR....",
    "..KKKKKKKKKKKK..",
    ".RRRRRRRRRRRRRR.",
    "RRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRR",
    ".RRRRRRRRRRRRRR.",
    "...RRRRRRRRRR...",
    "................",
    "................",
    "................",
  ],
  palette: { R: "#ee0000", K: "#8b0000" },
};

const SUSE: Logo = {
  map: [
    "................",
    "................",
    "......GGGGGG....",
    "....GGGGGGGGGG..",
    "...GGGGGGGGGGGG.",
    "..GGGGGGGGGGGGGG",
    "..GGGWKGGGGGGGGG",
    "..GGGWKGGGGGGGG.",
    "..GGGGGGGGGGGG..",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    ".....GGGGGG.....",
    "......GGGG......",
    ".......GG.......",
    "................",
    "................",
  ],
  palette: { G: "#30ba78", W: "#ffffff", K: "#06030f" },
};

const UBUNTU: Logo = {
  map: [
    "................",
    "......OOOO......",
    "....OO.WW.OO....",
    "...O...WW...O...",
    "..O..........O..",
    "..O..........O..",
    ".O............O.",
    ".O.WW......WW.O.",
    ".O.WW......WW.O.",
    "..O..........O..",
    "..O..........O..",
    "...O........O...",
    "....OO....OO....",
    "......OOOO......",
    "................",
    "................",
  ],
  palette: { O: "#e95420", W: "#ffffff" },
};

const MINT: Logo = {
  map: [
    "................",
    "..........GG....",
    "........GGGG....",
    "......GGGGGG....",
    "....GGGGGGGG....",
    "...GGGGGGGGG....",
    "..GGGGGGGGG.....",
    "..GGGGGGGG......",
    "..GGGGGGG.......",
    "..GGGGG.........",
    "...GGG..........",
    "....G...........",
    "....G...........",
    "....G...........",
    "................",
    "................",
  ],
  palette: { G: "#86be43" },
};

const FEDORA: Logo = {
  map: [
    "................",
    ".....BBBBBB.....",
    "...BBBBBBBBBB...",
    "..BBBBWWWWBBBB..",
    "..BBBWWBBBBBBB..",
    ".BBBBWWBBBBBBBB.",
    ".BBBBWWBBBBBBBB.",
    ".BBWWWWWWWBBBBB.",
    ".BBWWWWWWWBBBBB.",
    ".BBBBWWBBBBBBBB.",
    ".BBBBWWBBBBBBBB.",
    "..BBBWWBBBBBBB..",
    "..BBBBBBBBBBBB..",
    "...BBBBBBBBBB...",
    ".....BBBBBB.....",
    "................",
  ],
  palette: { B: "#51a2da", W: "#ffffff" },
};

const ROCKY: Logo = {
  map: [
    "................",
    "................",
    ".......GG.......",
    "......GGGG......",
    "......GWWG......",
    ".....GGWWGG.....",
    ".....GGGGGG.....",
    "....GGGGGGGG....",
    "....GGGGGGGG....",
    "...GGGGGGGGGG...",
    "..GGGGGGGGGGGG..",
    "..GGGGGGGGGGGG..",
    ".GGGGGGGGGGGGGG.",
    "................",
    "................",
    "................",
  ],
  palette: { G: "#10b981", W: "#d1fae5" },
};

const ALMA: Logo = {
  map: [
    "................",
    ".......BB.......",
    ".......BB.......",
    "......BBBB......",
    "......BBBB......",
    ".....BB..BB.....",
    ".....BB..BB.....",
    "....BBBBBBBB....",
    "....BBBBBBBB....",
    "...BBB....BBB...",
    "...BB......BB...",
    "..BB........BB..",
    "..BB........BB..",
    "................",
    "................",
    "................",
  ],
  palette: { B: "#4a9fd8" },
};

const MANJARO: Logo = {
  map: [
    "................",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    ".GGGG.GGGG.GGGG.",
    "................",
    "................",
    "................",
  ],
  palette: { G: "#35bf5c" },
};

const ENDEAVOUR: Logo = {
  map: [
    "................",
    ".............MM.",
    "...........MMMM.",
    ".........MMMMMM.",
    ".......MMMMMMM..",
    ".....MMMMMMM....",
    "...MMMMMMM......",
    ".MMMMMMM........",
    ".MMMMMM.........",
    "..MMMM..........",
    "...MM...........",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  palette: { M: "#7b3fb5" },
};

const CACHY: Logo = {
  map: [
    "................",
    ".....CCCCCC.....",
    "...CCCCCCCCCC...",
    "..CCCC....CCCC..",
    "..CCC......CCC..",
    ".CCC........CC..",
    ".CCC............",
    ".CCC............",
    ".CCC............",
    ".CCC........CC..",
    "..CCC......CCC..",
    "..CCCC....CCCC..",
    "...CCCCCCCCCC...",
    ".....CCCCCC.....",
    "................",
    "................",
  ],
  palette: { C: "#00bcd4" },
};

const LEAP: Logo = {
  map: [
    "................",
    "................",
    "............GGG.",
    "............GGG.",
    ".........GGGGGG.",
    ".........GGGGGG.",
    "......GGGGGGGGG.",
    "......GGGGGGGGG.",
    "...GGGGGGGGGGGG.",
    "...GGGGGGGGGGGG.",
    "GGGGGGGGGGGGGGG.",
    "GGGGGGGGGGGGGGG.",
    "................",
    "................",
    "................",
    "................",
  ],
  palette: { G: "#73ba25" },
};

const FAMILY_LOGOS: Record<string, Logo> = { debian: DEBIAN, arch: ARCH, redhat: REDHAT, suse: SUSE };

const DISTRO_LOGOS: Record<string, Logo> = {
  debian: DEBIAN,
  ubuntu: UBUNTU,
  mint: MINT,
  archlinux: ARCH,
  cachyos: CACHY,
  manjaro: MANJARO,
  endeavouros: ENDEAVOUR,
  fedora: FEDORA,
  rocky: ROCKY,
  alma: ALMA,
  tumbleweed: SUSE,
  leap: LEAP,
};

export function FamilyLogo({ id, size = 32, className = "", title }: { id: string; size?: number; className?: string; title?: string }) {
  const logo = FAMILY_LOGOS[id] ?? DEBIAN;
  return <Sprite map={logo.map} palette={logo.palette} size={size} className={className} title={title} />;
}

export function DistroLogo({
  id,
  familyId,
  size = 32,
  className = "",
  title,
}: {
  id: string;
  familyId?: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const logo = DISTRO_LOGOS[id] ?? FAMILY_LOGOS[familyId ?? ""] ?? DEBIAN;
  return <Sprite map={logo.map} palette={logo.palette} size={size} className={className} title={title} />;
}

export function FamilyBadge({ id, name, color, size = 44 }: { id: string; name: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center border-[3px] border-ink bg-bg-2"
      style={{ width: size, height: size, boxShadow: `inset -3px -3px 0 #00000055, inset 3px 3px 0 ${color}33, 3px 3px 0 #06030f` }}
      role="img"
      aria-label={`Logo de ${name}`}
    >
      <FamilyLogo id={id} size={Math.round(size * 0.74)} />
    </span>
  );
}
