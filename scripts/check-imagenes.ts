// Comprueba que cada avatar del catálogo apunte a un archivo que existe de
// verdad en public/, y que las medidas declaradas sean las del archivo.
//
// Hace falta porque un desajuste aquí no rompe la compilación: el build pasa
// y las imágenes salen partidas en producción.
//
// Uso: npm run check:imagenes
import { readFileSync, existsSync } from "node:fs";
import { SHOP_ITEMS } from "../src/data/shop.ts";

/** Ancho y alto de un PNG o un WebP, leídos de la cabecera. */
function medidas(buf: Buffer): { w: number; h: number } | null {
  // PNG: IHDR en los bytes 16-24
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    const tipo = buf.subarray(12, 16).toString("ascii");
    // VP8L (sin pérdida): 14 bits de ancho y 14 de alto, menos uno, empaquetados
    if (tipo === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (tipo === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (tipo === "VP8X") return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  return null;
}

let malos = 0;
let vistos = 0;
for (const item of SHOP_ITEMS) {
  if (!item.image) continue;
  vistos++;
  const ruta = "public" + item.image.src;
  if (!existsSync(ruta)) {
    console.log(`FALTA   ${item.id}: el catálogo apunta a ${item.image.src} y no existe`);
    malos++;
    continue;
  }
  const m = medidas(readFileSync(ruta));
  if (!m) {
    console.log(`RARO    ${item.id}: no se pudo leer el tamaño de ${item.image.src}`);
    malos++;
    continue;
  }
  if (m.w !== item.image.w || m.h !== item.image.h) {
    console.log(`MEDIDAS ${item.id}: el catálogo dice ${item.image.w}x${item.image.h} y el archivo es ${m.w}x${m.h}`);
    malos++;
  }
}

console.log(malos === 0 ? `OK: ${vistos} imágenes del catálogo verificadas` : `\n${malos} de ${vistos} imágenes mal`);
process.exit(malos === 0 ? 0 : 1);
