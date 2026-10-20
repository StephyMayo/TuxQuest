// Verifica el banco de preguntas: cada respuesta correcta debe ser aceptada por el corrector
// y ejecutarse sin errores en la terminal simulada de cada distribución donde aparece.
// Uso: npm run check:preguntas
import { QUESTION_BANK } from "../src/data/questions.ts";
import { DISTROS } from "../src/data/catalog.ts";
import { Shell } from "../src/lib/shell.ts";
import { isCorrect, correctCommand } from "../src/lib/answer.ts";

let bad = 0;
const ids = new Set<string>();
for (const q of QUESTION_BANK) {
  if (ids.has(q.id)) { console.log("ID DUPLICADO", q.id); bad++; }
  ids.add(q.id);
  for (const a of q.answers) {
    if (!isCorrect(q, a)) { console.log("NO ACEPTADA", q.id, a); bad++; }
  }
  if (q.type === "choice") continue;
  const distros = DISTROS.filter((d) => (!q.familyId || d.familyId === q.familyId) && (!q.distroId || d.id === q.distroId));
  for (const d of distros) {
    for (const a of q.type === "complete" ? [correctCommand(q)] : q.answers) {
      const errs = new Shell(d.hostname, d.id, d.familyId, d.name, q.cwd ?? "~").run(a).lines.filter((l) => l.kind === "err");
      if (errs.length) { console.log("ERROR", q.id, d.id, JSON.stringify(a), "->", errs.map((e) => e.text).join(" | ")); bad++; }
    }
  }
}
console.log(bad ? `${bad} problemas encontrados` : `OK: ${QUESTION_BANK.length} preguntas verificadas`);
process.exit(bad ? 1 : 0);
