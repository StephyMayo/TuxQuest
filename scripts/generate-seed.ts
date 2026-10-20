// Genera supabase/seed.sql a partir del banco de preguntas local.
// Uso: npm run seed
import { writeFileSync } from "node:fs";
import { DISTROS, FAMILIES } from "../src/data/catalog.ts";
import { QUESTION_BANK } from "../src/data/questions.ts";

const str = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const arr = (v: string[] | null | undefined) => (v == null ? "null" : `array[${v.map(str).join(", ")}]::text[]`);

const lines: string[] = [
  "-- Generado automáticamente con `npm run seed`. No editar a mano.",
  "begin;",
  "",
  "insert into public.families (id, name, package_manager, sort) values",
  FAMILIES.map((f, i) => `  (${str(f.id)}, ${str(f.name)}, ${str(f.packageManager)}, ${i})`).join(",\n"),
  "on conflict (id) do update set name = excluded.name, package_manager = excluded.package_manager, sort = excluded.sort;",
  "",
  "insert into public.distros (id, family_id, name, sort) values",
  DISTROS.map((d, i) => `  (${str(d.id)}, ${str(d.familyId)}, ${str(d.name)}, ${i})`).join(",\n"),
  "on conflict (id) do update set family_id = excluded.family_id, name = excluded.name, sort = excluded.sort;",
  "",
  "insert into public.questions (id, family_id, distro_id, difficulty, type, topic, prompt, answers, options, template, broken, hint, explanation, cwd) values",
  QUESTION_BANK.map(
    (q) =>
      `  (${[q.id, q.familyId, q.distroId, q.difficulty, q.type, q.topic, q.prompt].map(str).join(", ")}, ${arr(q.answers)}, ${arr(q.options)}, ${str(q.template)}, ${str(q.broken)}, ${str(q.hint)}, ${str(q.explanation)}, ${str(q.cwd)})`,
  ).join(",\n"),
  "on conflict (id) do update set family_id = excluded.family_id, distro_id = excluded.distro_id, difficulty = excluded.difficulty,",
  "  type = excluded.type, topic = excluded.topic, prompt = excluded.prompt, answers = excluded.answers, options = excluded.options,",
  "  template = excluded.template, broken = excluded.broken, hint = excluded.hint, explanation = excluded.explanation, cwd = excluded.cwd;",
  "",
  "commit;",
  "",
];

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"), "utf8");
console.log(`seed.sql generado: ${FAMILIES.length} familias, ${DISTROS.length} categorías, ${QUESTION_BANK.length} preguntas.`);
