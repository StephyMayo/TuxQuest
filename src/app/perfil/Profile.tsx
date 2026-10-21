"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KIND_HELP, KIND_LABEL, frameStyle, itemsOfKind, owns, titleText } from "@/data/shop";
import type { Slot } from "@/data/types";
import { ShopError } from "@/lib/backend";
import { PixelAvatar, PixelBag, PixelBulb, PixelClock, PixelCoin, PixelLock, PixelShield, PixelStar, starsFor } from "@/components/Pixel";
import { useRequirePlayer } from "@/components/useRequirePlayer";

const SLOTS: Slot[] = ["avatar", "titulo", "marco"];

const BOOST_ICON: Record<string, React.ReactNode> = {
  boost_monedas: <PixelCoin size={22} />,
  boost_tiempo: <PixelClock size={22} />,
  boost_pista: <PixelBulb size={22} />,
  boost_escudo: <PixelShield size={22} />,
};

interface Stats {
  done: number;
  stars: number;
  played: number;
}

export function Profile() {
  const { player, backend, inventory, setLoadout } = useRequirePlayer();
  const [slot, setSlot] = useState<Slot>("avatar");
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    backend
      .getProgress()
      .then((p) => {
        const all = Object.values(p);
        setStats({
          done: all.filter((m) => m.completed).length,
          stars: all.reduce((s, m) => s + starsFor(m.bestCorrect / m.bestTotal), 0),
          played: all.length,
        });
      })
      .catch(() => setStats({ done: 0, stars: 0, played: 0 }));
  }, [backend, player]);

  if (!player) return null;
  const { loadout } = player;
  const frame = frameStyle(loadout.marco);
  const boosts = itemsOfKind("boost").filter((b) => (inventory[b.id] ?? 0) > 0);

  async function equip(itemId: string) {
    setError(null);
    setBusy(itemId);
    try {
      setLoadout(await backend.equip(slot, itemId));
    } catch (e) {
      setError(e instanceof ShopError ? e.message : "No se pudo equipar. Revisa tu conexión.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* ---------- Tarjeta de perfil ---------- */}
      <div
        className="card flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left"
        style={{ borderColor: frame.border, boxShadow: `inset 3px 3px 0 #ffffff14, inset -3px -3px 0 #00000040, 6px 6px 0 #06030f, 0 0 24px ${frame.glow}` }}
      >
        <span
          className="grid shrink-0 place-items-center bg-bg-2 p-2"
          style={{ border: `4px solid ${frame.border}`, boxShadow: `0 0 16px ${frame.glow}` }}
        >
          <PixelAvatar id={loadout.avatar} size={88} bob title={`Avatar de ${player.username}`} />
        </span>

        <div className="flex-1">
          <h1 className="pixel-title text-base sm:text-lg">@{player.username}</h1>
          <p className="mt-2 font-game text-xl text-accent">{titleText(loadout.titulo)}</p>
          <p className="mt-1 text-sm text-muted">{player.email}</p>
        </div>

        <dl className="grid w-full grid-cols-3 gap-3 sm:w-auto">
          <Stat label="Monedas" value={String(player.coins)} icon={<PixelCoin size={16} />} />
          <Stat label="Misiones" value={String(stats?.done ?? "—")} />
          <Stat label="Estrellas" value={String(stats?.stars ?? "—")} icon={<PixelStar size={14} />} />
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/tienda" className="btn btn-primary btn-sm">
          <PixelBag size={16} /> Ir a la tienda
        </Link>
        <Link href="/jugar" className="btn btn-cyan btn-sm">
          ▶ Jugar
        </Link>
      </div>

      {/* ---------- Boosts en el inventario ---------- */}
      <section className="mt-10" aria-labelledby="boosts">
        <h2 id="boosts" className="pixel-title text-sm">
          MIS BOOSTS
        </h2>
        {boosts.length === 0 ? (
          <p className="card-flat mt-4 p-4 text-muted">
            Todavía no tienes boosts. En la{" "}
            <Link href="/tienda" className="font-game text-lg text-accent underline-offset-4 hover:underline">
              tienda
            </Link>{" "}
            puedes comprar ayudas para las misiones.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {boosts.map((b) => (
              <li key={b.id} className="card-flat flex items-center gap-3 p-4">
                {BOOST_ICON[b.id]}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-game text-lg">{b.name}</p>
                  <p className="font-pixel text-[10px] text-accent">x{inventory[b.id]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {boosts.length > 0 && <p className="mt-3 text-sm text-muted">Se activan dentro de una misión, desde la barra de boosts.</p>}
      </section>

      {/* ---------- Personalización ---------- */}
      <section className="mt-10" aria-labelledby="personalizar">
        <h2 id="personalizar" className="pixel-title text-sm">
          PERSONALIZAR
        </h2>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Ranuras de personalización">
          {SLOTS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={slot === s}
              className={`btn btn-sm ${slot === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setSlot(s);
                setError(null);
              }}
            >
              {KIND_LABEL[s]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-muted">{KIND_HELP[slot]}</p>

        <div aria-live="polite">
          {error && <p className="mt-4 border-[3px] border-ink bg-bad/20 px-3 py-2 text-sm text-[#ffc2c8]">✖ {error}</p>}
        </div>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemsOfKind(slot).map((item) => {
            const has = owns(inventory, item.id);
            const equipped = loadout[slot] === item.id;
            return (
              <li
                key={item.id}
                className={`card flex items-center gap-4 p-4 ${equipped ? "outline-[3px] outline-offset-4 outline-accent" : ""} ${has ? "" : "opacity-60"}`}
              >
                <SlotPreview slot={slot} id={item.id} name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-game text-lg">{item.name}</p>
                  {has ? (
                    equipped ? (
                      <p className="font-pixel text-[10px] text-ok">EQUIPADO</p>
                    ) : (
                      <button className="btn btn-ghost btn-sm mt-1" disabled={busy === item.id} onClick={() => equip(item.id)}>
                        {busy === item.id ? "…" : "Equipar"}
                      </button>
                    )
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <PixelLock size={14} /> {item.price} monedas en la tienda
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function SlotPreview({ slot, id, name }: { slot: Slot; id: string; name: string }) {
  if (slot === "avatar") return <PixelAvatar id={id} size={48} />;
  if (slot === "titulo")
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center border-[3px] border-ink bg-bg-2 font-pixel text-[13px] text-accent" aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  const { border, glow } = frameStyle(id);
  return (
    <span
      className="grid h-12 w-12 shrink-0 place-items-center bg-bg-2"
      style={{ border: `4px solid ${border}`, boxShadow: `0 0 12px ${glow}` }}
      aria-hidden="true"
    >
      <PixelAvatar id="tux" size={24} />
    </span>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="card-flat p-3">
      <dt className="font-game text-sm text-muted">{label}</dt>
      <dd className="mt-1 flex items-center justify-center gap-1.5 font-pixel text-sm sm:justify-start">
        {icon}
        {value}
      </dd>
    </div>
  );
}
