"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { familyById } from "@/data/catalog";
import { KIND_HELP, KIND_LABEL, frameStyle, itemById, itemsOfKind, owns, titleText } from "@/data/shop";
import type { Slot } from "@/data/types";
import { ShopError, USERNAME_HELP } from "@/lib/backend";
import { PixelAvatar, PixelBag, PixelBulb, PixelClock, PixelCoin, PixelLock, PixelShield, starsFor } from "@/components/Pixel";
import { Avatar } from "@/components/Avatar";
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
  /** Familia donde mas misiones ha superado. */
  family: string;
}

export function Profile() {
  const { player, backend, inventory, setLoadout, setPlayer } = useRequirePlayer();
  const [slot, setSlot] = useState<Slot>("avatar");
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // edición del nombre de usuario
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    backend
      .getProgress()
      .then((p) => {
        const all = Object.values(p);
        // La clave de mision es "familia:dificultad:tema": de ahi sale
        // en que familia ha superado mas misiones.
        const byFamily = new Map<string, number>();
        for (const [key, m] of Object.entries(p)) {
          if (!m.completed) continue;
          const fam = key.split(":")[0];
          byFamily.set(fam, (byFamily.get(fam) ?? 0) + 1);
        }
        const top = [...byFamily.entries()].sort((a, b) => b[1] - a[1])[0];
        setStats({
          done: all.filter((m) => m.completed).length,
          stars: all.reduce((s, m) => s + starsFor(m.bestCorrect / m.bestTotal), 0),
          played: all.length,
          family: top ? (familyById(top[0])?.name ?? top[0]) : "aún sin elegir",
        });
      })
      .catch(() => setStats({ done: 0, stars: 0, played: 0, family: "—" }));
  }, [backend, player]);

  if (!player) return null;
  const { loadout } = player;
  const frame = frameStyle(loadout.marco);
  const boosts = itemsOfKind("boost").filter((b) => (inventory[b.id] ?? 0) > 0);
  const boostCount = boosts.reduce((n, b) => n + (inventory[b.id] ?? 0), 0);

  async function saveName() {
    if (!player || savingName) return;
    setNameError(null);
    setSavingName(true);
    try {
      const nombre = await backend.setUsername(draft);
      setPlayer({ ...player, username: nombre });
      setEditing(false);
    } catch (e) {
      setNameError(e instanceof ShopError ? e.message : "No se pudo guardar. Revisa tu conexión.");
    } finally {
      setSavingName(false);
    }
  }

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
      {/* ---------- Ficha estilo neofetch ---------- */}
      <div
        className="card crt overflow-hidden"
        style={{ borderColor: frame.border, boxShadow: `inset 3px 3px 0 #ffffff14, inset -3px -3px 0 #00000040, 6px 6px 0 #06030f, 0 0 24px ${frame.glow}` }}
      >
        {/* barra de la ventana */}
        <div className="relative z-10 flex items-center gap-2 border-b-[3px] border-ink bg-panel-2 px-3 py-2">
          <span className="h-3 w-3 border-2 border-ink bg-bad" aria-hidden="true" />
          <span className="h-3 w-3 border-2 border-ink bg-accent" aria-hidden="true" />
          <span className="h-3 w-3 border-2 border-ink bg-ok" aria-hidden="true" />
          <span className="ml-2 truncate font-crt text-lg leading-none text-muted">
            {player.username}@tuxquest — perfil
          </span>
        </div>

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
            {/* el avatar hace de logo de la distro y llena el alto de la ventana */}
            <span
              className="grid h-56 w-44 shrink-0 place-items-center bg-bg-2 p-3 sm:h-auto sm:w-48"
              style={{ border: `4px solid ${frame.border}`, boxShadow: `0 0 16px ${frame.glow}` }}
            >
              <Avatar id={loadout.avatar} stretch bob title={`Avatar de ${player.username}`} />
            </span>

            <dl className="min-w-0 flex-1 font-crt text-[19px] leading-tight sm:text-[21px]">
              {editing ? (
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveName();
                  }}
                >
                  <label htmlFor="nick" className="sr-only">
                    Nombre de usuario
                  </label>
                  <input
                    id="nick"
                    className="input w-48 font-crt text-[19px]"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={20}
                    autoFocus
                    aria-describedby="nick-ayuda"
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={savingName}>
                    {savingName ? "…" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(false);
                      setNameError(null);
                    }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate">
                    <span className="text-[var(--term-prompt)]">{player.username}</span>
                    <span className="text-muted">@</span>
                    <span className="text-[var(--term-path)]">tuxquest</span>
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setDraft(player.username);
                      setNameError(null);
                      setEditing(true);
                    }}
                  >
                    ✎ Editar
                  </button>
                </p>
              )}
              <p id="nick-ayuda" className="mt-1 font-game text-base text-muted" aria-live="polite">
                {nameError ? <span className="text-bad">✖ {nameError}</span> : editing ? USERNAME_HELP : null}
              </p>
              <p className="my-1.5 select-none overflow-hidden text-muted" aria-hidden="true">
                {"─".repeat(60)}
              </p>

              <Line k="Título" v={titleText(loadout.titulo)} />
              <Line k="ID" v={player.id.slice(0, 8)} />
              <Line k="Familia" v={stats?.family ?? "…"} />
              <Line k="Monedas" v={String(player.coins)} />
              <Line k="Misiones" v={stats ? `${stats.done} superadas de ${stats.played} jugadas` : "…"} />
              <Line k="Estrellas" v={stats ? `${stats.stars} de ${stats.played * 3}` : "…"} />
              <Line k="Boosts" v={boostCount === 0 ? "ninguno" : `${boostCount} en el inventario`} />
              <Line k="Avatar" v={itemById(loadout.avatar)?.name ?? loadout.avatar} />
              <Line k="Marco" v={itemById(loadout.marco)?.name ?? loadout.marco} />
              <Line k="Correo" v={player.email} />
              <Line k="Modo" v={backend.mode === "supabase" ? "en línea" : "demo · solo este navegador"} />

              {/* la fila de colores que saca neofetch al final */}
              <div className="mt-5 flex flex-wrap justify-center gap-1.5 sm:justify-start" aria-hidden="true">
                {["#06030f", "#ff5c6c", "#4cff8f", "#ffd23f", "#6ab8ff", "#ff5d8f", "#3be8ff", "#f3efff"].map((c) => (
                  <span key={c} className="h-4 w-7 border-2 border-ink" style={{ background: c }} />
                ))}
              </div>
            </dl>
          </div>
        </div>
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
                className={`card flex gap-4 p-4 ${
                  // los avatares se ven en vertical y en grande; títulos y marcos en fila
                  slot === "avatar" ? "flex-col items-center text-center" : "items-center"
                } ${equipped ? "outline-[3px] outline-offset-4 outline-accent" : ""} ${has ? "" : "opacity-60"}`}
              >
                <SlotPreview slot={slot} id={item.id} name={item.name} />
                <div className={slot === "avatar" ? "w-full" : "min-w-0 flex-1"}>
                  <p className="truncate font-game text-lg">{item.name}</p>
                  {has ? (
                    equipped ? (
                      <p className="font-pixel text-[10px] text-ok">EQUIPADO</p>
                    ) : (
                      <button
                        className={`btn btn-ghost btn-sm mt-1 ${slot === "avatar" ? "w-full" : ""}`}
                        disabled={busy === item.id}
                        onClick={() => equip(item.id)}
                      >
                        {busy === item.id ? "…" : "Equipar"}
                      </button>
                    )
                  ) : (
                    <p className={`flex items-center gap-1.5 text-sm text-muted ${slot === "avatar" ? "justify-center" : ""}`}>
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
  if (slot === "avatar") return <Avatar id={id} size={128} className="shrink-0" />;
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

/** Una linea "clave: valor" de la ficha, al estilo de neofetch. */
function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-accent">{k}</dt>
      <dd className="min-w-0 flex-1 truncate text-[var(--term-text)]">{v}</dd>
    </div>
  );
}
