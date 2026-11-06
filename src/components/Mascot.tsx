import Image from "next/image";
import { guideFor, phraseFor } from "@/data/mascots";

export function MascotPortrait({
  familyId,
  width,
  className = "",
}: {
  familyId: string;

  width: number;
  className?: string;
}) {
  const g = guideFor(familyId);
  const src = `/guias/${g.familyId}-busto.png`;
  const dim = g.bust;
  return (
    <Image
      src={src}
      alt={`${g.name}, guía de la familia ${g.familyId}`}
      width={width}
      height={Math.round((width * dim.h) / dim.w)}
      className={`pixelated border-[3px] border-ink ${className}`}
      unoptimized
    />
  );
}

export function MascotTip({
  familyId,
  timedOut,
  seed,
  children,
}: {
  familyId: string;
  timedOut: boolean;

  seed: number;
  children: React.ReactNode;
}) {
  const g = guideFor(familyId);
  const phrase = phraseFor(g, timedOut, seed);
  return (
    <div className="mt-4 flex items-start gap-3">
      <div className="w-[88px] shrink-0 text-center sm:w-[104px]">
        <MascotPortrait familyId={familyId} width={104} className="w-full" />
        <p className="mt-1.5 font-pixel text-[9px] leading-tight" style={{ color: g.color }}>
          {g.name.toUpperCase()}
        </p>
        <p className="font-game text-sm leading-tight text-muted">{g.role}</p>
      </div>
      <div className="card-flat relative flex-1 p-3">
        <span
          className="absolute -left-[10px] top-5 h-0 w-0 border-y-[8px] border-r-[10px] border-y-transparent"
          style={{ borderRightColor: "var(--panel-2)" }}
          aria-hidden="true"
        />
        <p className="font-game text-lg leading-snug" style={{ color: g.color }}>
          {phrase}
        </p>
        <p className="mt-1.5 text-muted">{children}</p>
      </div>
    </div>
  );
}
