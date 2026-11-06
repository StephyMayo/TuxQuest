import Image from "next/image";
import { itemById } from "@/data/shop";
import { PixelAvatar } from "./Pixel";

export function Avatar({
  id,
  size,
  stretch = false,
  className = "",
  bob = false,
  title,
}: {
  id: string;

  size?: number;
  stretch?: boolean;
  className?: string;
  bob?: boolean;
  title?: string;
}) {
  const img = itemById(id)?.image;
  const fit = "h-full max-h-full w-auto max-w-full object-contain";

  if (!img) {
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
