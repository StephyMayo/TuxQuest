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
2. En **SQL Editor**, ejecuta en este orden: `supabase/schema.sql`, `supabase/seed.sql`,
   `supabase/shop.sql`, `supabase/avatares.sql`, `supabase/avatares-2.sql` y
   `supabase/perfil.sql`. Los cuatro últimos añaden la tienda, los avatares y la edición
   del perfil; todos se pueden volver a ejecutar sin romper nada.
3. En **Authentication > Sign In / Providers > Email**, desactiva *Confirm email* mientras desarrollan
   (si lo dejas activo, el jugador debe confirmar su correo antes de iniciar sesión; la app ya muestra ese aviso).

   > **«email rate limit exceeded» al registrarse.** El servidor de correo que Supabase presta gratis
   > solo envía unos pocos mensajes por hora para todo el proyecto, y ese límite se comparte entre
   > todas las cuentas. Si varias personas se registran seguidas, las siguientes reciben ese error.
   > Con *Confirm email* desactivado no se envía ningún correo y el problema desaparece. Si necesitas
   > confirmación real, configura un SMTP propio en **Authentication > Emails > SMTP Settings**
   > (Resend o Brevo tienen planes gratuitos suficientes).
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
| `npm run check:imagenes` | Comprueba que los avatares del catálogo existan y midan lo que dicen |
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
  components/           Terminal, cabecera, formularios, sesión, logos y guías
  app/
    page.tsx            Inicio
    registro, login     RF-01, RF-02
    jugar/              Asistente: familia → dificultad → modo (RF-03, RF-04)
    historia/           Modo historia: mapa de capítulos y arcade de escritura
    jugar/misiones      Lista de misiones y progreso (RF-06)
    jugar/partida       Partida: retos, temporizador, pistas, boosts y corrección (RF-05, RF-07, RF-08, RF-09)
    tienda              Tienda de boosts y cosméticos (RF-13)
    perfil              Perfil del jugador y personalización (RF-14)
supabase/
  schema.sql            Tablas, RLS y funciones (spend_coins, finish_mission)
  seed.sql              Familias, categorías y preguntas (generado)
  shop.sql              Tienda: shop_items, inventory, buy_item, equip_item, consume_boost
  avatares.sql          Avatares ilustrados del catálogo
  avatares-2.sql        18 avatares más y set_username()
  perfil.sql            Familia elegida en el perfil y set_family()
```

## Reglas de dificultad (punto 5.3)

| | Fácil | Medio | Difícil |
| --- | --- | --- | --- |
| Tipos de reto | Opción múltiple y completar | Escribir el comando | Escribir y corregir |
| Tiempo | Sin límite | 60 s | 30 s |
| Pistas | Gratis | 3 monedas | No disponibles |
| Monedas por acierto | 5 | 10 | 20 |

Una misión se marca como completada al acertar al menos el 70 % de sus retos.

## Tienda y perfil (RF-13, RF-14)

Las monedas que se ganan en las misiones se gastan en `/tienda`. Hay cuatro tipos de objeto:

| Tipo | Qué hace |
| --- | --- |
| **Boosts** | Ayudas que se gastan dentro de una misión. Se pueden acumular. |
| **Avatares** | La figura que aparece en el perfil y en la cabecera. |
| **Títulos** | Texto que acompaña al nombre de usuario. |
| **Marcos** | Color del borde de la tarjeta de perfil. |

Los boosts disponibles:

| Boost | Precio | Efecto |
| --- | --- | --- |
| Doble moneda | 25 | Duplica las monedas de la misión. Se activa desde la barra de boosts y se cobra al terminar. |
| Tiempo extra | 15 | +15 s al reloj del reto actual (solo en Medio y Difícil). |
| Pista gratis | 18 | Muestra la pista sin pagar, incluso en Difícil, que normalmente no tiene pistas. |
| Escudo de Tux | 40 | Al fallar un reto aparece el botón para convertir ese fallo en acierto. |

Los avatares, títulos y marcos más caros se desbloquean con misiones completadas
(columna `requires` de `shop_items`), así que no se pueden comprar solo juntando monedas.

Hay 27 avatares de dos clases. Los 6 de la familia Tux son sprites dibujados con mapas
de caracteres (`src/components/Pixel.tsx`). Los otros 21 son imágenes con transparencia
en `public/avatares/`, y se declaran con el campo `image` del objeto en
`src/data/shop.ts`. El componente `Avatar` elige uno u otro según el objeto, y los
encaja en una caja cuadrada para que todos ocupen lo mismo en la interfaz.

Del perfil se pueden cambiar tres cosas: el **nombre de usuario**, la **familia** y el
**correo**. El resto —ID, monedas, misiones, estrellas, boosts, avatar, título y marco—
sale del juego y no se edita a mano.

Las reglas del nombre (3 a 20 caracteres, letras, números o guion bajo) y la
comprobación de que no esté repetido se validan en `set_username()`, no solo en el
formulario; lo mismo con la familia en `set_family()`.

La familia se puede dejar sin elegir: entonces se deduce de aquella en la que se hayan
superado más misiones, y la ficha lo indica. El correo pasa por Supabase Auth, que manda
un enlace de confirmación a la dirección nueva: hasta que no se pulse, la cuenta sigue
con la anterior.

Las compras no se validan en el navegador: el precio, el desbloqueo y el descuento de
monedas los resuelven las funciones `buy_item()`, `equip_item()` y `consume_boost()` de
PostgreSQL, igual que ya se hacía con `spend_coins()`. El multiplicador del boost de
monedas se aplica dentro de `finish_mission()`, que además descuenta la unidad usada.

## Guías de cada familia

Cada familia de distribuciones tiene una guía: un personaje en pixel art que
aparece al fallar un reto para explicar el error con sus propias palabras,
además de la explicación de la pregunta. También se presenta en el mapa de
misiones.

| Familia | Guía |
| --- | --- |
| Debian | Debi · lo estable, paso a paso |
| Arch | Archel · siempre a la última |
| Red Hat | Red · firmeza de servidor |
| SUSE | Susie · el camaleón del equipo |

Los retratos están en `public/guias/` como PNG y se muestran sin optimizar
(`unoptimized`), porque el reescalado automático de Next emborrona el pixel
art. Los textos y las frases viven en `src/data/mascots.ts`.

Las frases se eligen con el índice del reto, no al azar, para que el texto no
cambie entre el servidor y el navegador.

## Logos

Los logos de familias y distribuciones son versiones simplificadas en pixel art de
16×16, dibujadas con el mismo sistema de mapas de caracteres que el resto de sprites
(`src/components/Logos.tsx`). No se descarga ninguna imagen externa.

Son recreaciones aproximadas para uso educativo; las marcas pertenecen a sus
respectivos proyectos.

## Modo historia

«El Camino de la Terminal»: nueve capítulos en tres actos que siguen el orden real de
aprendizaje. Cada capítulo usa el mismo tema que las misiones, así que los comandos
salen del banco de preguntas de la familia elegida.

Un capítulo se recorre en cuatro pasos: **la historia**, **cómo se juega**, el
**minijuego** y el **desenlace**. Hay prólogo, dos interludios entre actos y epílogo.

**Cada capítulo tiene un minijuego distinto**, y ninguno repite los tipos de reto del
modo solitario (opción múltiple, completar, escribir y corregir):

| Capítulo | Minijuego | Qué se practica |
| --- | --- | --- |
| Despertar en /home | Terminal guiada | La shell simulada de verdad, con objetivos que se marcan solos |
| El taller de archivos | Defensa de la terminal | Arcade: escribir el comando antes de que el enemigo llegue |
| El almacén de paquetes | Monta el comando | Ordenar las piezas del comando; dos sobran |
| La puerta de permisos | Candado de permisos | Rejilla rwx de 3×3, con su equivalente en octal |
| El laberinto de datos | Sigue el rastro | Marcar las líneas que encajan con un patrón |
| La sala de máquinas | Panel de parejas | Emparejar cada comando con lo que mide |
| Los procesos fantasma | Sala de procesos | Cerrar con `kill` los procesos colgados sin tocar los del sistema |
| Los servicios dormidos | Tablero de servicios | Elegir entre start, restart, enable y status |
| El puente de red | Sigue la ruta | Diagnosticar la conexión salto a salto hasta dar con la avería |

Cuatro jefes cierran capítulos, cada uno dentro de la mecánica que le toca: Kernel Panic
es un enemigo con más vida, Bucle Infinito un proceso de la tabla, Disco Lleno el último
servicio y El Root Perdido el otro extremo de la ruta.

Los temas finales tienen pocos comandos propios (`servicios` son tres), así que los
capítulos que tiran del banco mezclan comandos de los anteriores como repaso, 70/30.

El contenido que no sale del banco de preguntas —patrones, procesos, servicios y la
ruta de red— está en `src/data/minijuegos.ts`.

El progreso se guarda con `finish_mission()`, con la clave `historia:<tema>`, así que
no hace falta ninguna tabla nueva.

## Pendiente para las siguientes entregas

- RF-10 y RF-11: multijugador en tiempo real con Supabase Realtime (puntaje calculado en el servidor, RNF-05).
- RF-12 y RF-15: experiencia, niveles y ranking.
- RF-16 y RF-17: panel de administración. El esquema ya incluye la columna `profiles.role` y la tabla `questions`.
