import type { ReactNode } from "react";

/** Segment control — pressed = ink fill (works in standard + HC). */
export function SegButton({
  pressed,
  onClick,
  children,
  className = "",
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-[10px] border-[1.5px] px-2 py-2.5 font-sans text-[0.8125rem] font-semibold ${
        pressed
          ? "border-ink bg-ink text-card"
          : "border-border bg-paper text-ink"
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}
