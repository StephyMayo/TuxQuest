import Link from "next/link";
import { DIFFICULTIES, FAMILIES, distrosOf } from "@/data/catalog";
import { FamilyBadge, PixelBulb, PixelClock, PixelCoin, PixelLandscape, PixelStar, PixelTux } from "@/components/Pixel";

const STEPS = [
  ["Elige tu mundo", "Debian, Arch, Red Hat o SUSE."],
  ["Elige la distro", "Ubuntu, CachyOS, Fedora…"],
  ["Elige la dificultad", "Fácil, medio o difícil."],
  ["Elige el modo", "Solitario (multijugador pronto)."],
  ["Juega y gana", "Monedas por cada acierto."],
];

const TICKER = ["ls -la", "cd ~/proyectos", "sudo apt install vlc", "sudo pacman -Syu", "sudo dnf upgrade", "sudo zypper dup", "chmod +x script.sh", "grep -rn TODO .", "find ~ -name \"*.txt\"", "systemctl status sshd", "tar -czf respaldo.tar.gz docs", "ping -c 4 google.com"];

export default function Home() {
  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-6 pt-12 md:grid-cols-[1.15fr_1fr] md:pt-16">
          <div>
            <span className="chip text-cyan">★ JUEGO WEB · SIN INSTALAR NADA</span>
            <h1 className="pixel-title mt-5 text-[30px] leading-tight sm:text-[44px]">
              TUX<span className="text-accent">QUEST</span>
            </h1>
            <p className="mt-4 font-game text-2xl leading-snug sm:text-3xl">
              Aprende la terminal de Linux <span className="text-pink">superando misiones</span>.
            </p>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Escribe comandos reales en una terminal simulada, segura y dentro del navegador. Elige tu familia de distribuciones y domina sus comandos, desde los básicos
              hasta los avanzados.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/registro" className="btn btn-primary px-6 py-3 text-lg">
                ▶ PRESS START
              </Link>
              <Link href="/login" className="btn btn-ghost px-6 py-3 text-lg">
                Continuar partida
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="card overflow-hidden" aria-label="Ejemplo de la terminal simulada">
              <div className="flex items-center gap-2 border-b-[3px] border-ink bg-panel-2 px-3 py-2">
                <span className="h-3 w-3 border-2 border-ink bg-bad" />
                <span className="h-3 w-3 border-2 border-ink bg-accent" />
                <span className="h-3 w-3 border-2 border-ink bg-ok" />
                <span className="ml-2 font-crt text-lg text-muted">tux@archlinux: ~</span>
              </div>
              <pre className="crt whitespace-pre-wrap p-5 font-crt text-[20px] leading-snug text-[var(--term-text)]">
                <span className="text-muted"># MISIÓN: instala firefox en Arch</span>
                {"\n"}
                <span className="text-[var(--term-prompt)]">tux@archlinux</span>:<span className="text-[var(--term-path)]">~</span>$ sudo apt install firefox{"\n"}
                <span className="text-bad">bash: apt: orden no encontrada</span>
                {"\n"}
                <span className="text-[var(--term-prompt)]">tux@archlinux</span>:<span className="text-[var(--term-path)]">~</span>$ sudo pacman -S firefox{"\n"}
                resolviendo dependencias...{"\n"}
                <span className="text-accent">★ ¡CORRECTO! +10 MONEDAS</span>
                {"\n"}
                <span className="text-[var(--term-prompt)]">tux@archlinux</span>:<span className="text-[var(--term-path)]">~</span>$ <span className="blink">█</span>
              </pre>
            </div>
            <PixelTux size={84} bob className="absolute -bottom-10 -right-3 drop-shadow-[4px_4px_0_#06030f]" />
          </div>
        </div>
        <PixelLandscape className="mt-6 h-24 sm:h-32" />
      </section>

      {/* Cinta de comandos */}
      <div className="overflow-hidden border-b-[3px] border-ink bg-accent py-2.5 text-accent-ink" aria-hidden="true">
        <div className="marquee flex w-max gap-10 font-crt text-2xl">
          {[...TICKER, ...TICKER].map((c, i) => (
            <span key={i} className="whitespace-nowrap">
              $ {c} <span className="ml-8">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Cómo funciona */}
        <section className="py-16" aria-labelledby="como">
          <h2 id="como" className="pixel-title text-center text-lg sm:text-2xl">
            ¿CÓMO SE JUEGA?
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="card relative p-5 pt-8">
                <span className="pixel-title absolute -top-4 left-4 border-[3px] border-ink bg-pink px-2 py-1 text-[11px] text-white" style={{ textShadow: "2px 2px 0 #06030f" }}>
                  NIVEL {i + 1}
                </span>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Mundos */}
        <section className="py-10" aria-labelledby="familias">
          <h2 id="familias" className="pixel-title text-center text-lg sm:text-2xl">
            ELIGE TU MUNDO
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted">
            Los comandos básicos son iguales en todas las familias. Lo que más cambia es el gestor de paquetes.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FAMILIES.map((f) => (
              <article key={f.id} className="card flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <FamilyBadge name={f.name} color={f.color} />
                  <div>
                    <h3 className="text-2xl font-semibold leading-none">{f.name}</h3>
                    <span className="font-crt text-xl text-accent">{f.packageManager}</span>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm text-muted">{distrosOf(f.id).map((d) => d.name).join(" · ")}</p>
                <code className="crt mt-4 block border-[3px] border-ink px-3 py-2 font-crt text-lg text-[var(--term-text)]">$ {f.example}</code>
              </article>
            ))}
          </div>
        </section>

        {/* Dificultades */}
        <section className="py-16" aria-labelledby="niveles">
          <h2 id="niveles" className="pixel-title text-center text-lg sm:text-2xl">
            SELECCIONA DIFICULTAD
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DIFFICULTIES.map((d, i) => (
              <article key={d.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">{d.name}</h3>
                  <span className="flex gap-1" aria-label={`${i + 1} de 3`}>
                    {[0, 1, 2].map((s) => (
                      <PixelStar key={s} size={20} filled={s <= i} />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-muted">{d.commands}</p>
                <ul className="mt-5 space-y-3 font-game text-lg">
                  <li className="flex items-center gap-3">
                    <PixelClock size={18} /> {d.seconds ? `${d.seconds} s por reto` : "Sin límite de tiempo"}
                  </li>
                  <li className="flex items-center gap-3">
                    <PixelBulb size={16} /> Pistas: {d.hintCost === null ? "no disponibles" : d.hintCost === 0 ? "gratis" : `${d.hintCost} monedas`}
                  </li>
                  <li className="flex items-center gap-3 text-accent">
                    <PixelCoin size={18} /> +{d.coins} monedas por acierto
                  </li>
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Llamado final */}
        <section className="card mb-6 flex flex-col items-center gap-5 px-6 py-12 text-center">
          <PixelTux size={88} bob />
          <h2 className="pixel-title text-base sm:text-xl">¿LISTO PARA TU PRIMERA MISIÓN?</h2>
          <p className="text-lg text-muted">Crea tu cuenta y empieza a jugar en menos de un minuto.</p>
          <Link href="/registro" className="btn btn-primary px-6 py-3 text-lg">
            ▶ CREAR CUENTA GRATIS
          </Link>
        </section>
      </div>
    </div>
  );
}
