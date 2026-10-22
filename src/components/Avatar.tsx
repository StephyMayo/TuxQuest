import Image from "next/image";
import { itemById } from "@/data/shop";
import { PixelAvatar } from "./Pixel";

/**
 * Avatar del jugador. Los de la familia Tux son sprites de píxeles y los
 * demás, imágenes.
 *
 * Con `size` se dibuja dentro de una caja cuadrada de ese lado, para que
 * todos ocupen lo mismo en la interfaz. Con `stretch` llena el alto del
 * contenedor sin deformarse, que es como se usa en la ficha del perfil.
 *
 * Las imágenes van sin optimizar a propósito: son pixel art y el reescalado
 * automático las emborrona.
 */
export function Avatar({
  id,
  size,
  stretch = false,
  className = "",
  bob = false,
  title,
}: {
  id: string;
  /** Lado de la caja cuadrada. Se ignora si `stretch` está puesto. */
  size?: number;
  stretch?: boolean;
  className?: string;
  bob?: boolean;
  title?: string;
}) {
  const img = itemById(id)?.image;
  const fit = "h-full max-h-full w-auto max-w-full object-contain";

  if (!img) {
    // El SVG del sprite ya mantiene la proporción al escalar.
    return (
      <PixelAvatar
        id={id}
        size={size ?? 96}
        className={`${stretch ? fit : ""} ${className}`}
        bob={bob}
        title={title}
      />
    );
  }

  const picture = (
    <Image
      src={img.src}
      alt={title ?? ""}
      width={stretch ? img.w : Math.round(((size ?? 96) * img.w) / img.h)}
      height={stretch ? img.h : (size ?? 96)}
      className={`pixelated ${bob ? "bob" : ""} ${stretch ? fit : ""}`}
      unoptimized
    />
  );

  if (stretch) return <span className={`grid h-full place-items-center ${className}`}>{picture}</span>;

  return (
    <span className={`grid place-items-center ${className}`} style={{ width: size, height: size }}>
      {picture}
    </span>
  );
}
