import Image from "next/image";
import { itemById } from "@/data/shop";
import { PixelAvatar } from "./Pixel";

/**
 * Avatar del jugador. Los de la familia Tux son sprites de píxeles y los
 * demás, imágenes. En ambos casos se dibuja dentro de una caja cuadrada de
 * `size`, para que todos ocupen lo mismo en la interfaz.
 *
 * Las imágenes van sin optimizar a propósito: son pixel art y el reescalado
 * automático las emborrona.
 */
export function Avatar({
  id,
  size,
  className = "",
  bob = false,
  title,
}: {
  id: string;
  size: number;
  className?: string;
  bob?: boolean;
  title?: string;
}) {
  const img = itemById(id)?.image;
  if (!img) return <PixelAvatar id={id} size={size} className={className} bob={bob} title={title} />;
  return (
    <span className={`grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <Image
        src={img.src}
        alt={title ?? ""}
        width={Math.round((size * img.w) / img.h)}
        height={size}
        className={`pixelated ${bob ? "bob" : ""}`}
        unoptimized
      />
    </span>
  );
}
