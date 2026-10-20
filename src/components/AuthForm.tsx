"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthError, DEMO_ACCOUNT } from "@/lib/backend";
import { useAuth } from "./AuthProvider";
import { PixelTux } from "./Pixel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const { backend, player, setPlayer } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/jugar";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (player) router.replace(next);
  }, [player, next, router]);

  const isRegister = mode === "registro";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (isRegister && !USER_RE.test(username)) return setError("El nombre de usuario debe tener de 3 a 20 caracteres: letras, números o _.");
    if (!EMAIL_RE.test(email)) return setError("Escribe un correo electrónico válido.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setBusy(true);
    try {
      if (isRegister) {
        const p = await backend.signUp(username.trim(), email.trim(), password);
        if (!p) {
          setInfo("¡Cuenta creada! Revisa tu correo y confirma tu cuenta para poder iniciar sesión.");
          return;
        }
        setPlayer(p);
        router.replace("/jugar?bienvenida=1");
      } else {
        setPlayer(await backend.signIn(email.trim(), password));
        router.replace(next);
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <PixelTux size={72} bob />
        <h1 className="pixel-title mt-5 text-lg sm:text-xl">{isRegister ? "NUEVO JUGADOR" : "CONTINUAR PARTIDA"}</h1>
        <p className="mt-2 text-muted">{isRegister ? "Crea tu cuenta y empieza tu primera misión." : "Inicia sesión para seguir con tus misiones."}</p>
      </div>

      <div className="card p-6 sm:p-7">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {isRegister && (
            <Field label="Nombre de usuario" id="username">
              <input id="username" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="pinguino_veloz" required />
            </Field>
          )}
          <Field label="Correo electrónico" id="email">
            <input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </Field>
          <Field label="Contraseña" id="password">
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </Field>

          <div aria-live="polite">
            {error && <p className="border-[3px] border-ink bg-bad/20 px-3 py-2 text-sm text-[#ffc2c8]">✖ {error}</p>}
            {info && <p className="border-[3px] border-ink bg-ok/15 px-3 py-2 text-sm text-ok">✔ {info}</p>}
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 text-lg" disabled={busy}>
            {busy ? "Cargando…" : isRegister ? "▶ Crear cuenta" : "▶ Entrar"}
          </button>
        </form>

        {!isRegister && backend.mode === "demo" && (
          <div className="card-flat mt-6 p-4">
            <p className="font-game text-lg text-accent">★ Cuenta de prueba</p>
            <p className="mt-1 font-crt text-xl leading-tight">
              {DEMO_ACCOUNT.email}
              <br />
              {DEMO_ACCOUNT.password}
            </p>
            <button
              type="button"
              className="btn btn-cyan btn-sm mt-3"
              onClick={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
              }}
            >
              Usar cuenta de prueba
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-muted">
          {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
          <Link href={isRegister ? "/login" : "/registro"} className="font-game text-lg text-accent underline-offset-4 hover:underline">
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
      {backend.mode === "demo" && (
        <p className="mt-6 text-center text-xs text-muted">Modo demo: las cuentas se guardan solo en este navegador. Conecta Supabase para cuentas reales.</p>
      )}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-game text-lg">
        {label}
      </label>
      {children}
    </div>
  );
}
