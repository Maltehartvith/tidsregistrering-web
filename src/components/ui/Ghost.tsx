import type { CSSProperties } from "react";

/** Shared pulse block for skeleton / ghost placeholders. */
export function GhostBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/70 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function CategoryCardGhost() {
  return (
    <div className="cat-card mb-3 rounded-[14px] border border-border bg-card px-4.5 py-4">
      <GhostBlock className="mb-2 h-3 w-28" />
      <GhostBlock className="mb-2.5 h-7 w-20" />
      <GhostBlock className="h-2 w-full rounded-full" />
      <div className="mt-2 flex justify-between">
        <GhostBlock className="h-3 w-36" />
        <GhostBlock className="h-3 w-8" />
      </div>
    </div>
  );
}

export function EntryRowGhost() {
  return (
    <div className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-b-0">
      <GhostBlock className="h-2 w-2 shrink-0 rounded-full" />
      <GhostBlock className="h-3.5 w-20" />
      <GhostBlock className="h-3 w-16" />
      <GhostBlock className="ml-auto h-3.5 w-8" />
    </div>
  );
}

export function BrandHeaderGhost() {
  return (
    <div className="px-5 pb-4.5 pt-6.5">
      <div className="flex items-center gap-2.5">
        <GhostBlock className="h-6.5 w-20" />
        <GhostBlock className="h-3 w-24" />
      </div>
      <div className="mt-2">
        <GhostBlock className="mb-1.5 h-8 w-48" />
        <GhostBlock className="h-3.5 w-56" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
        <span className="stitch-line" />
      </div>
    </div>
  );
}
