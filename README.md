# TuxQuest

Juego web para aprender comandos Linux por familias de distribuciones (Debian, Arch, Red Hat y SUSE).
Proyecto de la Tarea 05 · SENATI · Ingeniería de Software con IA.

**Primera entrega (RF-01 a RF-09):** cuentas de usuario, elección de familia, categoría y dificultad,
terminal simulada, modo solitario con misiones, cuatro tipos de reto, corrección inmediata y pistas.

Stack: **Next.js 16 + React 19 + Tailwind CSS 4**, **Supabase** (PostgreSQL + Auth) y despliegue en **Vercel**.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

Si no hay variables de Supabase, la app funciona en **modo demo**: las cuentas, las monedas y el progreso
se guardan solo en el navegador (`localStorage`). Sirve para probar y presentar sin servidor.

## Conectar Supabase

1. Crea un proyecto en https://supabase.com (plan gratuito).
2. En **SQL Editor**, ejecuta primero `supabase/schema.sql` y después `supabase/seed.sql`.
3. En **Authentication > Sign In / Providers > Email**, desactiva *Confirm email* mientras desarrollan
   (si lo dejas activo, el jugador debe confirmar su correo antes de iniciar sesión; la app ya muestra ese aviso).
4. Copia `.env.example` como `.env.local` y completa los datos de **Project Settings > API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Reinicia `npm run dev`. El aviso «modo demo» de la cabecera desaparece.

En Vercel, agrega esas mismas dos variables en **Settings > Environment Variables**.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` | ESLint |
| `npm run check:preguntas` | Verifica que cada respuesta correcta sea aceptada por el corrector y se ejecute sin error en la terminal simulada de cada distribución |
| `npm run seed` | Regenera `supabase/seed.sql` desde el banco de preguntas local |

## Estructura

```
src/
  data/                 Catálogo (familias, distros, dificultades) y banco de 223 preguntas
    questions-common.ts   Comandos comunes a todas las familias
    questions-packages.ts Gestores de paquetes por familia y retos propios de cada distro
  lib/
    shell.ts            Terminal simulada: sistema de archivos virtual + intérprete tipo bash
    answer.ts           Corrector (normaliza espacios, comillas y el orden de opciones: ls -la == ls -al)
    missions.ts         Arma las misiones por tema y elige las preguntas de cada partida
    backend.ts          Capa de datos: Supabase o modo demo
  components/           Terminal, cabecera, formularios, sesión
  app/
    page.tsx            Inicio
    registro, login     RF-01, RF-02
    jugar/              Asistente: familia → categoría → dificultad → modo (RF-03, RF-04)
    jugar/misiones      Lista de misiones y progreso (RF-06)
    jugar/partida       Partida: retos, temporizador, pistas y corrección (RF-05, RF-07, RF-08, RF-09)
supabase/
  schema.sql            Tablas, RLS y funciones (spend_coins, finish_mission)
  seed.sql              Familias, categorías y preguntas (generado)
```

## Reglas de dificultad (punto 5.3)

| | Fácil | Medio | Difícil |
| --- | --- | --- | --- |
| Tipos de reto | Opción múltiple y completar | Escribir el comando | Escribir y corregir |
| Tiempo | Sin límite | 60 s | 30 s |
| Pistas | Gratis | 3 monedas | No disponibles |
| Monedas por acierto | 5 | 10 | 20 |

Una misión se marca como completada al acertar al menos el 70 % de sus retos.

## Pendiente para las siguientes entregas

- RF-10 y RF-11: multijugador en tiempo real con Supabase Realtime (puntaje calculado en el servidor, RNF-05).
- RF-12 a RF-15: experiencia y niveles, tienda de skins, perfil y ranking.
- RF-16 y RF-17: panel de administración. El esquema ya incluye la columna `profiles.role` y la tabla `questions`.
