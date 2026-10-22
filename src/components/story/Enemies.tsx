/** Enemigos del modo historia, dibujados con el mismo sistema que el resto de sprites. */
import type { BossId, EnemyId } from "@/data/story";
import { Sprite, type Palette } from "@/components/Pixel";

interface Art {
  map: string[];
  palette: Palette;
}

// --- Enemigos corrientes (16x16) ---------------------------------------

/** Bicho: el fallo de toda la vida. */
const BICHO: Art = {
  map: [
    "................",
    "..K..........K..",
    "...K........K...",
    "....KKKKKKKK....",
    "...KGGGGGGGGK...",
    "..KGGWKGGKWGGK..",
    ".KGGGGGGGGGGGGK.",
    "KGGKGGGGGGGGKGGK",
    "KGGKGGKKKKGGKGGK",
    "KGGKGGGGGGGGKGGK",
    ".KGGGGGGGGGGGGK.",
    "..KGGGGGGGGGGK..",
    "...KGGGGGGGGK...",
    "..K..KKKKKK..K..",
    ".K....K..K....K.",
    "................",
  ],
  palette: { K: "#06030f", G: "#6ee06e", W: "#ffffff" },
};

/** Proceso zombi: terminó hace meses y sigue ahí. */
const ZOMBI: Art = {
  map: [
    "................",
    "....KKKKKKKK....",
    "...KPPPPPPPPK...",
    "..KPPPPPPPPPPK..",
    "..KPKKPPPPKKPK..",
    "..KPKRPPPPRKPK..",
    "..KPPPPPPPPPPK..",
    "..KPPPKKKKPPPK..",
    "..KPPPPPPPPPPK..",
    "..KPKPKPKPKPPK..",
    "...KPPPPPPPPK...",
    "....KKKKKKKK....",
    "...K.K....K.K...",
    "..K..K....K..K..",
    ".K...K....K...K.",
    "................",
  ],
  palette: { K: "#06030f", P: "#9ad6a0", R: "#c4576b" },
};

/** Fuga de memoria: gotea y cada vez va más rápido. */
const FUGA: Art = {
  map: [
    ".......KK.......",
    "......KCCK......",
    "......KCCK......",
    ".....KCCCCK.....",
    "....KCCCCCCK....",
    "...KCCWCCCCCK...",
    "..KCCWCCCCCCCK..",
    "..KCCCCCCCCCCK..",
    ".KCCCCCCCCCCCCK.",
    ".KCCKKCCCCKKCCK.",
    ".KCCKKCCCCKKCCK.",
    ".KCCCCCCCCCCCCK.",
    "..KCCCCCCCCCCK..",
    "...KKCCCCCCKK...",
    ".....KKKKKK.....",
    "......K..K......",
  ],
  palette: { K: "#06030f", C: "#4fc3f7", W: "#dff6ff" },
};

/** Paquete roto: al destruirlo se parte en dos. */
const ROTO: Art = {
  map: [
    "................",
    "..KKKKKKKKKKKK..",
    "..KBBBBKKBBBBK..",
    "..KBBBKWWKBBBK..",
    "..KBBKWWWWKBBK..",
    "..KBBBKWWKBBBK..",
    "..KBBBBKKBBBBK..",
    "..KKKKKKKKKKKK..",
    "..KBBBBBBBBBBK..",
    "..KBBKBBBBKBBK..",
    "..KBBBKBBKBBBK..",
    "..KBBBBKKBBBBK..",
    "..KBBBKBBKBBBK..",
    "..KBBKBBBBKBBK..",
    "..KKKKKKKKKKKK..",
    "................",
  ],
  palette: { K: "#06030f", B: "#d08b3c", W: "#ffe0a8" },
};

/** Demonio huérfano: escuda al que tenga al lado. */
const HUERFANO: Art = {
  map: [
    "....K......K....",
    "....KK....KK....",
    "...KMMKKKKMMK...",
    "..KMMMMMMMMMMK..",
    ".KMMMMMMMMMMMMK.",
    ".KMMWWMMMMWWMMK.",
    ".KMMWKMMMMWKMMK.",
    ".KMMMMMMMMMMMMK.",
    ".KMMMMKKKKMMMMK.",
    ".KMMMKMMMMKMMMK.",
    ".KMMMMMMMMMMMMK.",
    "..KMMMMMMMMMMK..",
    "..KMMKMMMMKMMK..",
    "...KMKKMMKKMK...",
    "....KK.KK.KK....",
    "................",
  ],
  palette: { K: "#06030f", M: "#b57ae0", W: "#ffe7a8" },
};

const ENEMY_ART: Record<EnemyId, Art> = {
  bicho: BICHO,
  zombi: ZOMBI,
  fuga: FUGA,
  roto: ROTO,
  huerfano: HUERFANO,
};

// --- Jefes (20x20) -----------------------------------------------------

/** Kernel Panic: la pantalla que no vuelve. */
const PANICO: Art = {
  map: [
    "....KKKKKKKKKKKK....",
    "...KRRRRRRRRRRRRK...",
    "..KRRRRRRRRRRRRRRK..",
    ".KRRKKRRRRRRRRKKRRK.",
    ".KRRKWKRRRRRRKWKRRK.",
    ".KRRKKRRRRRRRRKKRRK.",
    ".KRRRRRRRRRRRRRRRRK.",
    ".KRRRRRRRRRRRRRRRRK.",
    ".KRRRKKKKKKKKKKRRRK.",
    ".KRRKWKWKWKWKWKKRRK.",
    ".KRRKKKKKKKKKKKKRRK.",
    ".KRRRRRRRRRRRRRRRRK.",
    "..KRRRRRRRRRRRRRRK..",
    "...KRRRRRRRRRRRRK...",
    "....KKRRRRRRRRKK....",
    "...K..KKKKKKKK..K...",
    "..K...K......K...K..",
    ".K....K......K....K.",
    "K.....K......K.....K",
    "......K......K......",
  ],
  palette: { K: "#06030f", R: "#ff5c6c", W: "#ffffff" },
};

/** Bucle Infinito: otra vez, otra vez, otra vez. */
const BUCLE: Art = {
  map: [
    "......KKKKKKKK......",
    "....KKYYYYYYYYKK....",
    "...KYYYYYYYYYYYYK...",
    "..KYYYYKKKKKKYYYYK..",
    "..KYYYKKWWWWKKYYYK..",
    ".KYYYKKWWWWWWKKYYYK.",
    ".KYYYKWWKKKKWWKYYYK.",
    ".KYYYKWKYYYYKWKYYYK.",
    ".KYYYKWKYYYYKWKYYYK.",
    ".KYYYKWWKKKKWWKYYYK.",
    ".KYYYKKWWWWWWKKYYYK.",
    "..KYYYKKWWWWKKYYYK..",
    "..KYYYYKKKKKKYYYYK..",
    "...KYYYYYYYYYYYYK...",
    "....KKYYYYYYYYKK....",
    "......KKKKKKKK......",
    ".......K....K.......",
    "......K......K......",
    ".....K........K.....",
    "....K..........K....",
  ],
  palette: { K: "#06030f", Y: "#ffd23f", W: "#2a1a00" },
};

/** Disco Lleno: ya no cabe nada más. */
const DISCO: Art = {
  map: [
    "..KKKKKKKKKKKKKKKK..",
    ".KGGGGGGGGGGGGGGGGK.",
    "KGGKKKKKKKKKKKKKKGGK",
    "KGKWWWWWWWWWWWWWWKGK",
    "KGKWKKKKKKKKKKKKWKGK",
    "KGKWKGGGGGGGGGGKWKGK",
    "KGKWKGGKKKKKKGGKWKGK",
    "KGKWKGGKWWWWKGGKWKGK",
    "KGKWKGGKWKKWKGGKWKGK",
    "KGKWKGGKWWWWKGGKWKGK",
    "KGKWKGGKKKKKKGGKWKGK",
    "KGKWKGGGGGGGGGGKWKGK",
    "KGKWKKKKKKKKKKKKWKGK",
    "KGKWWWWWWWWWWWWWWKGK",
    "KGGKKKKKKKKKKKKKKGGK",
    ".KGGGGGGGGGGGGGGGGK.",
    "..KKGGGGGGGGGGGGKK..",
    "....KKKKKKKKKKKK....",
    ".....K........K.....",
    "....K..........K....",
  ],
  palette: { K: "#06030f", G: "#8f86d0", W: "#3be8ff" },
};

/** El Root Perdido: llegó hasta aquí antes que tú. */
const ROOT: Art = {
  map: [
    ".......KKKKKK.......",
    "....KKKWWWWWWKKK....",
    "...KWWWWWWWWWWWWK...",
    "..KWWKKWWWWWWKKWWK..",
    "..KWWKRKWWWWKRKWWK..",
    "..KWWKKWWWWWWKKWWK..",
    "..KWWWWWWWWWWWWWWK..",
    "..KWWWWKKKKKKWWWWK..",
    "..KWWWKRRRRRRKWWWK..",
    "..KWWWWKKKKKKWWWWK..",
    "...KWWWWWWWWWWWWK...",
    "....KKWWWWWWWWKK....",
    "..KKKKWWWWWWWWKKKK..",
    ".KWWWWWWWWWWWWWWWWK.",
    ".KWWKWWWWWWWWWWKWWK.",
    ".KWWKWWKKKKKKWWKWWK.",
    ".KWWKWKWWWWWWKWKWWK.",
    ".KWWKKKWWWWWWKKKWWK.",
    "..KKK.KWWWWWWK.KKK..",
    "......KK....KK......",
  ],
  palette: { K: "#06030f", W: "#cfd6e6", R: "#ff5c6c" },
};

const BOSS_ART: Record<BossId, Art> = { panico: PANICO, bucle: BUCLE, disco: DISCO, root: ROOT };

export function EnemySprite({ id, size = 40, className = "" }: { id: EnemyId; size?: number; className?: string }) {
  const a = ENEMY_ART[id];
  return <Sprite map={a.map} palette={a.palette} size={size} className={className} />;
}

export function BossSprite({ id, size = 96, className = "" }: { id: BossId; size?: number; className?: string }) {
  const a = BOSS_ART[id];
  return <Sprite map={a.map} palette={a.palette} size={size} className={className} />;
}
