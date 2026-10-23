"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KIND_HELP, KIND_LABEL, SHOP_ORDER, frameStyle, itemsOfKind, owns } from "@/data/shop";
import type { ItemKind, ShopItem } from "@/data/types";
import { ShopError } from "@/lib/backend";
import { PixelAvatar, PixelBag, PixelBulb, PixelClock, PixelCoin, PixelLock, PixelShield, PixelTux } from "@/components/Pixel";
import { Avatar } from "@/components/Avatar";
import { useRequirePlayer } from "@/components/useRequirePlayer";

const BOOST_ICON: Record<string, React.ReactNode> = {
  boost_coins: <PixelCoin size={34} />,
  boost_time: <PixelClock size={34} />,
  boost_hint: <PixelBulb size={34} />,
  boost_shield: <PixelShield size={34} />,
};

export function Shop() {
  const { player, backend, inventory, setCoins, setInventory } = useRequirePlayer();
  const [tab, setTab] = useState<ItemKind>("boost");
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);

  // Misiones completadas: hacen falta para saber qué está desbloqueado
  useEffect(() => {
    if (!player) return;
    backend
      .getProgress()
      .then((filas) => setDone(filas.filter((f) => f.completed).length))
      .catch(() => setDone(0));
  }, [backend, player]);

  if (!player) return null;

  async function buy(item: ShopItem) {
    setError(null);
    setBought(null);
    setBusy(item.id);
    try {
      const { coins, inventory: inv } = await backend.buyItem(item.id);
      setCoins(coins);
      setInventory(inv);
      setBought(item.id);
    } catch (e) {
      setError(e instanceof ShopError ? e.message : "No se pudo completar la compra. Revisa tu conexión.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <PixelBag size={52} />
        <div className="flex-1">
          <h1 className="pixel-title text-base sm:text-lg">TIENDA DE TUX</h1>
          <p className="mt-2 font-game text-xl text-muted">Gasta las monedas que ganas en las misiones.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip bg-bg-2 font-pixel text-[11px] text-accent">
            <PixelCoin size={16} /> {player.coins}
          </span>
          <Link href="/perfil" className="btn btn-ghost btn-sm">
            ☰ Mi perfil
          </Link>
        </div>
      </div>

      {/* Pestañas por tipo de objeto */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Categorías de la tienda">
        {SHOP_ORDER.map((kind) => (
          <button
            key={kind}
            role="tab"
            aria-selected={tab === kind}
            className={`btn btn-sm ${tab === kind ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setTab(kind);
              setError(null);
              setBought(null);
            }}
          >
            {KIND_LABEL[kind]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-muted">{KIND_HELP[tab]}</p>

      <div aria-live="polite">
        {error && <p className="mt-4 border-[3px] border-ink bg-bad/20 px-3 py-2 text-sm text-[#ffc2c8]">✖ {error}</p>}
      </div>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {itemsOfKind(tab).map((item) => {
          const qty = inventory[item.id] ?? 0;
          const has = owns(inventory, item.id);
          const locked = !!item.requires && done < item.requires;
          const poor = player.coins < item.price;
          const free = item.price === 0;
          // Los cosméticos se compran una sola vez; los boosts se acumulan
          const canBuy = !locked && !poor && (item.stackable || !has);

          return (
            <li key={item.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <ItemPreview item={item} />
                {!free && (
                  <span className={`chip shrink-0 font-pixel text-[10px] ${poor && canBuy ? "text-bad" : "text-accent"}`}>
                    <PixelCoin size={14} /> {item.price}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-semibold leading-tight">{item.name}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>

              {item.stackable && qty > 0 && <p className="mt-3 font-game text-lg text-cyan">Tienes {qty}</p>}

              <div className="mt-4">
                {locked ? (
                  <p className="card-flat flex items-center gap-2 p-3 text-sm text-muted">
                    <PixelLock size={16} />
                    Se desbloquea con {item.requires} misiones completadas · llevas {done}
                  </p>
                ) : free ? (
                  <p className="font-game text-lg text-ok">✔ Incluido desde el inicio</p>
                ) : has && !item.stackable ? (
                  <Link href="/perfil" className="btn btn-ghost w-full">
                    ✔ Comprado · equipar
                  </Link>
                ) : (
                  <button className="btn btn-primary w-full" disabled={!canBuy || busy === item.id} onClick={() => buy(item)}>
                    {busy === item.id ? "Comprando…" : poor ? "Monedas insuficientes" : `Comprar por ${item.price}`}
                  </button>
                )}
                {bought === item.id && (
                  <p className="pop mt-2 font-game text-lg text-ok" role="status">
                    ✔ ¡Comprado!
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card-flat mt-10 flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
        <PixelTux size={44} bob />
        <p className="flex-1 text-muted">
          ¿Sin monedas? Cada misión te da monedas por acierto: 5 en Fácil, 10 en Medio y 20 en Difícil.
        </p>
        <Link href="/jugar" className="btn btn-cyan">
          ▶ Jugar
        </Link>
      </div>
    </div>
  );
}

/** Miniatura del objeto según su tipo. */
function ItemPreview({ item }: { item: ShopItem }) {
  if (item.kind === "boost") return <span className="grid h-14 w-14 place-items-center">{BOOST_ICON[item.id]}</span>;
  if (item.kind === "avatar") return <Avatar id={item.id} size={56} className="shrink-0" />;
  if (item.kind === "title")
    return (
      <span className="chip bg-bg-2 font-game text-base text-accent" aria-hidden="true">
        {item.name}
      </span>
    );
  const { border, glow } = frameStyle(item.id);
  return (
    <span
      className="grid h-14 w-14 place-items-center bg-bg-2"
      style={{ border: `4px solid ${border}`, boxShadow: `0 0 0 2px #06030f, 0 0 14px ${glow}` }}
      aria-hidden="true"
    >
      <PixelAvatar id="tux" size={28} />
    </span>
  );
}
